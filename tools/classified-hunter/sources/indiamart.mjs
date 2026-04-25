/**
 * IndiaMART source — HTML scraping for indiamart.com wedding vendor listings.
 */

import { fetchWithRetry, delay, isAllowedByRobots } from '../lib/anti-bot.mjs';
import { normalizeVendor, deduplicateVendors } from '../lib/normalizer.mjs';

const BASE = 'https://www.indiamart.com';

const CATEGORY_QUERIES = {
  venue: 'wedding-venue',
  photographer: 'wedding-photographer',
  makeup: 'bridal-makeup-artist',
  caterer: 'wedding-caterer',
  decorator: 'wedding-decorator',
  dj: 'wedding-dj',
  pandit: 'wedding-pandit',
  planner: 'wedding-planner',
};

/**
 * Scrape IndiaMART for vendors in a given city + category.
 * @param {object} opts
 * @param {string} opts.city
 * @param {string} opts.category - schema category value
 * @param {number} [opts.limit=20]
 * @returns {Promise<object[]>} normalized vendors
 */
export async function scrapeIndiamart({ city, category, limit = 20 }) {
  const query = CATEGORY_QUERIES[category] ?? `wedding-${category}`;
  const path = `/impcat/${query}.html`;
  const searchUrl = `${BASE}/search.mp?ss=${encodeURIComponent(`wedding ${category} ${city}`)}`;

  const allowed = await isAllowedByRobots(BASE, path);
  if (!allowed) {
    console.warn(`  [indiamart] robots.txt disallows ${path} — skipping`);
    return [];
  }

  console.log(`  [indiamart] fetching ${searchUrl}`);

  const res = await fetchWithRetry(searchUrl);
  if (!res.ok) {
    console.warn(`  [indiamart] HTTP ${res.status}`);
    return [];
  }

  const html = await res.text();
  const vendors = parseListings(html, city, category);
  await delay();

  return deduplicateVendors(vendors.slice(0, limit));
}

function parseListings(html, city, category) {
  const results = [];

  // IndiaMART uses specific class patterns for company names in search results
  const nameRe = /class="[^"]*(?:companyname|co_name|lcname)[^"]*"[^>]*>([^<]{2,120})</gi;
  const descRe = /class="[^"]*(?:objectinfo|prodDesc|desc)[^"]*"[^>]*>\s*([^<]{10,400})\s*</gi;

  const names = extractAll(html, nameRe);
  const descs = extractAll(html, descRe);

  for (let i = 0; i < names.length; i++) {
    const name = decodeHtml(names[i].trim());
    if (!name || name.length < 2) continue;

    const vendor = normalizeVendor(
      {
        name,
        city,
        category,
        description: decodeHtml(descs[i] ?? ''),
      },
      'indiamart',
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

export { scrapeIndiamart as scrape };
