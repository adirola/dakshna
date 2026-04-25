/**
 * Map scraped data to the canonical vendor schema.
 * Normalizes categories, cities, and pricing ranges.
 */

import { toSlug } from '../../shared/schema.mjs';

// Map common scraped category strings → schema enum values
const CATEGORY_MAP = {
  // venue
  'venue': 'venue', 'hall': 'venue', 'banquet': 'venue', 'hotel': 'venue',
  'resort': 'venue', 'garden': 'venue', 'mandap': 'venue', 'palace': 'venue',
  'kalyana': 'venue', 'convention': 'venue',
  // photographer
  'photographer': 'photographer', 'photography': 'photographer',
  'videographer': 'photographer', 'photo': 'photographer', 'video': 'photographer',
  // makeup
  'makeup': 'makeup', 'bridal makeup': 'makeup', 'mehndi': 'makeup',
  'hair': 'makeup', 'beauty': 'makeup', 'salon': 'makeup',
  // caterer
  'caterer': 'caterer', 'catering': 'caterer', 'food': 'caterer',
  'thali': 'caterer', 'kitchen': 'caterer',
  // decorator
  'decorator': 'decorator', 'decoration': 'decorator', 'florist': 'decorator',
  'floral': 'decorator', 'flower': 'decorator', 'lighting': 'decorator',
  'mandap decor': 'decorator',
  // dj
  'dj': 'dj', 'disc jockey': 'dj', 'music': 'dj', 'band': 'dj',
  'sound': 'dj', 'entertainment': 'dj',
  // pandit
  'pandit': 'pandit', 'priest': 'pandit', 'pujari': 'pandit',
  'purohit': 'pandit', 'religious': 'pandit',
  // planner
  'planner': 'planner', 'planning': 'planner', 'coordinator': 'planner',
  'event management': 'planner', 'wedding planner': 'planner',
};

// City name normalization: scraped variants → canonical lowercase
const CITY_MAP = {
  'bengaluru': 'bangalore', 'blr': 'bangalore', 'namma bengaluru': 'bangalore',
  'bombay': 'mumbai', 'mum': 'mumbai', 'navi mumbai': 'mumbai',
  'madras': 'chennai', 'hyderabad city': 'hyderabad', 'cyberabad': 'hyderabad',
  'new delhi': 'delhi', 'ncr': 'delhi', 'delhi ncr': 'delhi',
  'kolkata': 'kolkata', 'calcutta': 'kolkata',
  'pune': 'pune', 'poona': 'pune',
  'ahmedabad': 'ahmedabad', 'amdavad': 'ahmedabad',
  'jaipur': 'jaipur', 'pink city': 'jaipur',
  'lucknow': 'lucknow', 'chandigarh': 'chandigarh',
  'kochi': 'kochi', 'cochin': 'kochi',
};

// Map price strings to schema enum
const PRICING_RE = [
  { re: /budget|cheap|affordable|economy|low.cost/i, value: 'budget' },
  { re: /mid|moderate|standard|average/i, value: 'mid' },
  { re: /premium|high.end|upscale|quality/i, value: 'premium' },
  { re: /luxury|elite|ultra|grand|top|five.star/i, value: 'luxury' },
];

/**
 * Normalize a scraped category string to the schema enum.
 * Returns null if no match found.
 */
export function normalizeCategory(raw) {
  if (!raw) return null;
  const lower = raw.toLowerCase().trim();
  for (const [key, val] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(key)) return val;
  }
  return null;
}

/**
 * Normalize a scraped city name to lowercase canonical form.
 */
export function normalizeCity(raw) {
  if (!raw) return '';
  const lower = raw.toLowerCase().trim().replace(/\s+/g, ' ');
  return CITY_MAP[lower] ?? lower;
}

/**
 * Normalize a price string or number to a schema pricingRange.
 * Falls back to 'mid' if unknown.
 */
export function normalizePricingRange(raw) {
  if (!raw) return 'mid';
  const str = String(raw).toLowerCase();
  for (const { re, value } of PRICING_RE) {
    if (re.test(str)) return value;
  }
  // Numeric INR ranges
  const num = parseInt(str.replace(/[^0-9]/g, ''), 10);
  if (!isNaN(num)) {
    if (num < 50000) return 'budget';
    if (num < 200000) return 'mid';
    if (num < 1000000) return 'premium';
    return 'luxury';
  }
  return 'mid';
}

/**
 * Build a full normalized vendor object from raw scraped data.
 * @param {object} raw - raw scraped fields
 * @param {string} source - scraper name (for debugging)
 * @returns {object|null} - normalized vendor or null if required fields missing
 */
export function normalizeVendor(raw, source) {
  const name = (raw.name ?? '').trim();
  if (!name) return null;

  const city = normalizeCity(raw.city ?? raw.location ?? '');
  const category = normalizeCategory(raw.category ?? raw.type ?? '');
  if (!category) {
    console.warn(`  [normalizer] could not map category "${raw.category ?? raw.type}" for "${name}" — skipping`);
    return null;
  }

  const slug = toSlug(`${name} ${city}`);
  const description = (raw.description ?? raw.about ?? raw.snippet ?? '')
    .trim()
    .slice(0, 500) || `${name} — ${category} in ${city}`;

  return {
    slug,
    name,
    category,
    city,
    region: raw.region ?? undefined,
    description,
    pricingRange: normalizePricingRange(raw.price ?? raw.pricing ?? raw.priceRange ?? ''),
    url: raw.url ?? raw.website ?? undefined,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    related: [],
    featured: false,
    verified: false,
    _source: source,
  };
}

/**
 * Deduplicate vendors within a batch by name + city similarity.
 * Simple exact-match dedup; fuzzy dedup is in tools/growth/duplicate-detector.mjs.
 */
export function deduplicate(vendors) {
  const seen = new Set();
  return vendors.filter((v) => {
    const key = `${v.name.toLowerCase()}::${v.city.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
