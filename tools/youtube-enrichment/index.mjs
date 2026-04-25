#!/usr/bin/env node
/**
 * YouTube Enrichment — find YouTube channels and videos for each vendor.
 *
 * Usage:
 *   node tools/youtube-enrichment/index.mjs \
 *     --vendors ./src/content/vendors \
 *     --output ./data/youtube.json
 *
 * Requires YOUTUBE_API_KEY in environment (or falls back to web scraping).
 *
 * Output shape:
 *   { [vendorSlug]: { channel: string|null, videos: VideoResult[], subscriberCount: number|null } }
 */

import { parseArgs } from 'node:util';
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { config } from '../shared/config.mjs';
import { fetchWithRetry, delay } from '../classified-hunter/lib/anti-bot.mjs';

const { values } = parseArgs({
  options: {
    vendors: { type: 'string', default: './src/content/vendors' },
    output:  { type: 'string', default: './data/youtube.json' },
    limit:   { type: 'string', default: '5' },
  },
  strict: false,
});

const videoLimit = parseInt(values.limit, 10) || 5;

/** YouTube Data API v3 search */
async function searchYouTubeApi(query, maxResults = videoLimit) {
  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('q', query);
  url.searchParams.set('type', 'channel,video');
  url.searchParams.set('maxResults', String(maxResults));
  url.searchParams.set('regionCode', 'IN');
  url.searchParams.set('key', config.youtubeApiKey);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);
  return res.json();
}

/** Scrape YouTube search results without API (fallback) */
async function searchYouTubeScrape(query, maxResults = videoLimit) {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  const res = await fetchWithRetry(url);
  if (!res.ok) return { items: [] };

  const html = await res.text();
  const items = [];

  // Extract video IDs from initial data JSON embedded in page
  const initDataMatch = html.match(/var ytInitialData\s*=\s*(\{.+?\});\s*<\/script>/s);
  if (!initDataMatch) return { items: [] };

  try {
    const data = JSON.parse(initDataMatch[1]);
    const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents
      ?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents ?? [];

    for (const item of contents) {
      const vr = item.videoRenderer;
      const cr = item.channelRenderer;

      if (vr && items.length < maxResults) {
        items.push({
          kind: 'youtube#searchResult',
          id: { kind: 'youtube#video', videoId: vr.videoId },
          snippet: { title: vr.title?.runs?.[0]?.text ?? '', channelTitle: vr.ownerText?.runs?.[0]?.text ?? '' },
        });
      }
      if (cr && items.length < maxResults) {
        items.push({
          kind: 'youtube#searchResult',
          id: { kind: 'youtube#channel', channelId: cr.channelId },
          snippet: { title: cr.title?.simpleText ?? '', customUrl: cr.customUrl ?? '' },
        });
      }
    }
  } catch { /* parsing failed — return empty */ }

  return { items };
}

async function enrichVendor(vendor) {
  const query = `${vendor.name} ${vendor.city} wedding`;

  let data;
  if (config.youtubeApiKey) {
    data = await searchYouTubeApi(query);
  } else {
    data = await searchYouTubeScrape(query);
  }

  const items = data.items ?? [];
  const channelItem = items.find((i) => i.id?.kind === 'youtube#channel');
  const videoItems = items.filter((i) => i.id?.kind === 'youtube#video').slice(0, videoLimit);

  return {
    channel: channelItem ? `https://www.youtube.com/channel/${channelItem.id.channelId}` : null,
    videos: videoItems.map((v) => ({
      url: `https://www.youtube.com/watch?v=${v.id.videoId}`,
      title: v.snippet?.title ?? '',
    })),
    subscriberCount: null, // Requires a separate channels.list API call; omitted to save quota
  };
}

// Main
const vendorFiles = readdirSync(values.vendors).filter((f) => f.endsWith('.json'));
console.log(`\nYouTube Enrichment — ${vendorFiles.length} vendors`);
if (!config.youtubeApiKey) console.log('  (No YOUTUBE_API_KEY — using web scrape fallback)');

const results = {};

for (let i = 0; i < vendorFiles.length; i++) {
  const file = vendorFiles[i];
  const vendor = JSON.parse(readFileSync(join(values.vendors, file), 'utf8'));
  process.stdout.write(`  [${i + 1}/${vendorFiles.length}] ${vendor.slug}… `);

  try {
    results[vendor.slug] = await enrichVendor(vendor);
    const { channel, videos } = results[vendor.slug];
    console.log(`${channel ? '📺' : '—'} ${videos.length} video(s)`);
  } catch (err) {
    console.log(`error: ${err.message}`);
    results[vendor.slug] = { channel: null, videos: [], subscriberCount: null };
  }

  if (i < vendorFiles.length - 1) await delay(1500);
}

mkdirSync(dirname(values.output), { recursive: true });
writeFileSync(values.output, JSON.stringify(results, null, 2) + '\n', 'utf8');
console.log(`\nSaved → ${values.output}`);
