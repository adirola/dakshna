/**
 * JustDial source — HTML scraping with anti-bot measures.
 * Scrapes search results from justdial.com for wedding vendors.
 */

import { fetchWithRetry, delay, isAllowedByRobots } from '../lib/anti-bot.mjs';
import { normalizeVendor, deduplicate } from '../lib/normalizer.mjs';

const BASE = 'https://www.justdial.com';

// Map schema categories to JustDial search keywords
const CATEGORY_KEYWORDS = {
  venue: 'wedding-venues',
  photographer: 'wedding-photographers',
  makeup: 'bridal-makeup-artists',
  caterer: 'wedding-caterers',
  decorator: 'wedding-decorators',
  dj: 'dj-for-wedding',
  pandit: 'wedding-pandits',
  planner: 'wedding-planners',
};

/**
 * Scrape JustDial for vendors in a given city + category.
 * @param {object} opts
 * @param {string} opts.city
 * @param {string} opts.category - schema category value
 * @param {number} [opts.limit=20]
 * @returns {Promise<object[]>} normalized vendors
 */
export async function scrapeJustDial({ city, category, limit = 20 }) {
  const keyword = CATEGORY_KEYWORDS[category] ?? `wedding-${category}`;
  const citySlug = city.toLowerCase().replace(/\s+/g, '-');
  const path = `/${citySlug}/${keyword}`;

  const allowed = await isAllowedByRobots(BASE, path);
  if (!allowed) {
    console.warn(`  [justdial] robots.txt disallows ${path} — skipping`);
    return [];
  }

  const url = `${BASE}${path}`;
  console.log(`  [justdial] fetching ${url}`);

  const res = await fetchWithRetry(url);
  if (!res.ok) {
    console.warn(`  [justdial] HTTP ${res.status} for ${url}`);
    return [];
  }

  const html = await res.text();
  const vendors = parseListings(html, city, category);
  await delay();

  return deduplicate(vendors.slice(0, limit));
}

/**
 * Parse JustDial listing HTML into raw vendor objects.
 * Uses regex-based extraction (no DOM parser dependency).
 */
function parseListings(html, city, category) {
  const results = [];

  // JustDial renders listing names in data attributes or structured spans
  // Pattern targets the common companyname / jsx-comp spans
  const nameRe = /class="[^"]*(?:companyname|company-name|resultbox_title)[^"]*"[^>]*>([^<]+)<\/(?:span|a|h2)/gi;
  const addrRe = /class="[^"]*(?:address-info|jdcon-map-pin)[^"]*"[^>]*>\s*([^<]{5,120})\s*</gi;
  const descRe = /class="[^"]*(?:jdcon-review|tagline)[^"]*"[^>]*>\s*([^<]{10,300})\s*</gi;

  const names = extractAll(html, nameRe);
  const addrs = extractAll(html, addrRe);
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
        location: addrs[i] ? `${addrs[i]}, ${city}` : city,
      },
      'justdial',
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
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}
