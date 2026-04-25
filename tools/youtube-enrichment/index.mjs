#!/usr/bin/env node
import { Command } from 'commander';
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import matter from 'gray-matter';
import { getYoutubeConfig } from '../shared/config.mjs';
import { fetchWithRetry, delay } from '../classified-hunter/lib/anti-bot.mjs';

const program = new Command();

program
  .option('--vendors <path>', 'Path to src/content/vendors/', './src/content/vendors')
  .option('--output <path>', 'Output JSON file path', './data/youtube.json')
  .option('--dry-run', 'Log results only, do not write output file', false)
  .parse(process.argv);

const opts = program.opts();

async function searchYouTubeApi(vendorName, city, apiKey) {
  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('q', `${vendorName} ${city} wedding`);
  url.searchParams.set('type', 'channel,video');
  url.searchParams.set('maxResults', '5');
  url.searchParams.set('key', apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);
  const data = await res.json();
  const items = data.items ?? [];
  const channelItem = items.find((i) => i.id?.kind === 'youtube#channel');
  const videoItems = items.filter((i) => i.id?.kind === 'youtube#video');
  return {
    channelUrl: channelItem ? `https://www.youtube.com/channel/${channelItem.id.channelId}` : null,
    videos: videoItems.map((v) => ({ url: `https://www.youtube.com/watch?v=${v.id.videoId}`, title: v.snippet?.title ?? '' })),
    subscriberCount: null,
  };
}

async function searchYouTubeFallback(vendorName, city) {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${vendorName} ${city} wedding`)}`;
  try {
    const res = await fetchWithRetry(url);
    if (!res.ok) return { channelUrl: null, videos: [], subscriberCount: null };
    const html = await res.text();
    const match = html.match(/var ytInitialData\s*=\s*(\{.+?\});\s*<\/script>/s);
    if (!match) return { channelUrl: null, videos: [], subscriberCount: null };
    const data = JSON.parse(match[1]);
    const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents
      ?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents ?? [];
    const videos = contents
      .filter((c) => c.videoRenderer)
      .slice(0, 5)
      .map((c) => ({
        url: `https://www.youtube.com/watch?v=${c.videoRenderer.videoId}`,
        title: c.videoRenderer.title?.runs?.[0]?.text ?? '',
      }));
    return { channelUrl: null, videos, subscriberCount: null };
  } catch {
    return { channelUrl: null, videos: [], subscriberCount: null };
  }
}

async function readAllVendors(vendorsDir) {
  const files = (await readdir(vendorsDir)).filter((f) => f.endsWith('.md') && f !== '.gitkeep');
  return Promise.all(
    files.map(async (f) => {
      const raw = await readFile(join(vendorsDir, f), 'utf8');
      const { data } = matter(raw);
      return data;
    })
  );
}

const config = getYoutubeConfig();
const vendors = await readAllVendors(opts.vendors);

console.log(`\nYouTube Enrichment — ${vendors.length} vendors`);
if (!config.apiKey) console.log('  (No YOUTUBE_API_KEY — using web scrape fallback)');

const results = {};

for (let i = 0; i < vendors.length; i++) {
  const vendor = vendors[i];
  process.stdout.write(`  [${i + 1}/${vendors.length}] ${vendor.id}… `);

  try {
    results[vendor.id] = config.apiKey
      ? await searchYouTubeApi(vendor.name, vendor.city, config.apiKey)
      : await searchYouTubeFallback(vendor.name, vendor.city);
    const { channelUrl, videos } = results[vendor.id];
    console.log(`${channelUrl ? 'channel' : '—'} ${videos.length} video(s)`);
  } catch (err) {
    console.log(`error: ${err.message}`);
    results[vendor.id] = { channelUrl: null, videos: [], subscriberCount: null };
  }

  if (i < vendors.length - 1) await delay(1000);
}

console.log(`\nEnriched ${Object.keys(results).length}/${vendors.length} vendors`);

if (opts.dryRun) {
  console.log(JSON.stringify(results, null, 2));
} else {
  await mkdir(dirname(opts.output), { recursive: true });
  await writeFile(opts.output, JSON.stringify(results, null, 2) + '\n', 'utf8');
  console.log(`Saved → ${opts.output}`);
}
