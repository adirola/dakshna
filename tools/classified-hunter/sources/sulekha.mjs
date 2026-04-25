/**
 * Sulekha source — HTML scraping for sulekha.com wedding vendor listings.
 */

import { fetchWithRetry, delay, isAllowedByRobots } from '../lib/anti-bot.mjs';
import { normalizeVendor, deduplicate } from '../lib/normalizer.mjs';

const BASE = 'https://www.sulekha.com';

const CATEGORY_PATHS = {
  venue: 'banquet-halls',
  photographer: 'wedding-photographers',
  makeup: 'bridal-makeup',
  caterer: 'wedding-caterers',
  decorator: 'wedding-decorators',
  dj: 'dj-services',
  pandit: 'pandits',
  planner: 'wedding-planners',
};

/**
 * Scrape Sulekha for vendors in a given city + category.
 * @param {object} opts
 * @param {string} opts.city
 * @param {string} opts.category - schema category value
 * @param {number} [opts.limit=20]
 * @returns {Promise<object[]>} normalized vendors
 */
export async function scrapeSulekha({ city, category, limit = 20 }) {
  const catPath = CATEGORY_PATHS[category] ?? category;
  const citySlug = city.toLowerCase().replace(/\s+/g, '-');
  const path = `/${catPath}/${citySlug}`;

  const allowed = await isAllowedByRobots(BASE, path);
  if (!allowed) {
    console.warn(`  [sulekha] robots.txt disallows ${path} — skipping`);
    return [];
  }

  const url = `${BASE}${path}`;
  console.log(`  [sulekha] fetching ${url}`);

  const res = await fetchWithRetry(url);
  if (!res.ok) {
    console.warn(`  [sulekha] HTTP ${res.status} for ${url}`);
    return [];
  }

  const html = await res.text();
  const vendors = parseListings(html, city, category);
  await delay();

  return deduplicate(vendors.slice(0, limit));
}

function parseListings(html, city, category) {
  const results = [];

  // Sulekha uses h2/h3 for business names in listing cards
  const nameRe = /class="[^"]*(?:biz-name|business-name|company-name|spname)[^"]*"[^>]*>([^<]{2,120})</gi;
  const descRe = /class="[^"]*(?:desc|about|snippet)[^"]*"[^>]*>\s*([^<]{10,400})\s*</gi;
  const urlRe = /href="(https?:\/\/(?:www\.)?(?!sulekha)[a-z0-9.-]+\.[a-z]{2,}[^"]*?)"/gi;

  const names = extractAll(html, nameRe);
  const descs = extractAll(html, descRe);
  const urls = extractAll(html, urlRe);

  for (let i = 0; i < names.length; i++) {
    const name = decodeHtml(names[i].trim());
    if (!name || name.length < 2) continue;

    const vendor = normalizeVendor(
      {
        name,
        city,
        category,
        description: decodeHtml(descs[i] ?? ''),
        url: urls[i] ?? undefined,
      },
      'sulekha',
    );
    if (vendor) results.push(vendor);
  }

  return results;
}

function extractAll(html, re) {
  const results = [];
  let m;
  const cloned = new RegExp(re.source, re.flags);
  while ((m = cloned.exec(html)) !== null) {
    results.push(m[1]);
  }
  return results;
}

function decodeHtml(str) {
  return str
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&nbsp;/g, ' ')
    .trim();
}
