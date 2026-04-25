import { slugify } from '../../shared/schema.mjs';

export const CATEGORY_MAPPINGS = {
  'wedding venue': 'venue', 'banquet hall': 'venue', 'wedding hall': 'venue',
  'function hall': 'venue', 'convention centre': 'venue',
  'venue': 'venue', 'hall': 'venue', 'banquet': 'venue', 'hotel': 'venue',
  'resort': 'venue', 'garden': 'venue', 'mandap': 'venue', 'palace': 'venue',
  'kalyana': 'venue',
  'wedding photographer': 'photographer', 'photography': 'photographer',
  'photographer': 'photographer', 'videographer': 'photographer',
  'photo': 'photographer', 'video': 'photographer',
  'bridal makeup': 'makeup', 'makeup artist': 'makeup',
  'makeup': 'makeup', 'mehndi': 'makeup', 'hair': 'makeup',
  'beauty': 'makeup', 'salon': 'makeup',
  'wedding catering': 'caterer', 'catering services': 'caterer',
  'caterer': 'caterer', 'catering': 'caterer', 'food': 'caterer',
  'thali': 'caterer', 'kitchen': 'caterer',
  'event decorator': 'decorator', 'floral decorator': 'decorator',
  'decorator': 'decorator', 'decoration': 'decorator', 'florist': 'decorator',
  'floral': 'decorator', 'flower': 'decorator', 'lighting': 'decorator',
  'dj services': 'dj', 'wedding dj': 'dj',
  'dj': 'dj', 'disc jockey': 'dj', 'music': 'dj', 'band': 'dj', 'sound': 'dj',
  'wedding planner': 'planner', 'event planner': 'planner',
  'planner': 'planner', 'planning': 'planner', 'coordinator': 'planner',
  'event management': 'planner',
  'pandit': 'pandit', 'priest': 'pandit', 'pujari': 'pandit',
  'purohit': 'pandit', 'religious': 'pandit',
};

export const CITY_TO_REGION = {
  'bangalore': 'south-india', 'bengaluru': 'south-india', 'blr': 'south-india',
  'chennai': 'south-india', 'hyderabad': 'south-india',
  'kochi': 'south-india', 'cochin': 'south-india', 'coimbatore': 'south-india',
  'delhi': 'north-india', 'new delhi': 'north-india', 'ncr': 'north-india',
  'lucknow': 'north-india', 'jaipur': 'north-india', 'chandigarh': 'north-india',
  'mumbai': 'west-india', 'bombay': 'west-india',
  'pune': 'west-india', 'poona': 'west-india', 'ahmedabad': 'west-india',
  'kolkata': 'east-india', 'calcutta': 'east-india', 'bhubaneswar': 'east-india',
};

const PRICING_RE = [
  { re: /budget|cheap|affordable|economy|low.cost/i, value: 'budget' },
  { re: /mid|moderate|standard|average/i, value: 'mid' },
  { re: /premium|high.end|upscale|quality/i, value: 'premium' },
  { re: /luxury|elite|ultra|grand|top|five.star/i, value: 'luxury' },
];

/**
 * Map a raw category string to the schema enum value.
 * @param {string} rawCategory
 * @returns {string|null}
 */
export function mapCategory(rawCategory) {
  if (!rawCategory) return null;
  const lower = rawCategory.toLowerCase().trim();
  for (const [key, val] of Object.entries(CATEGORY_MAPPINGS)) {
    if (lower.includes(key)) return val;
  }
  return null;
}

/**
 * Infer the region enum value from a city name.
 * @param {string} city
 * @returns {string}
 */
export function inferRegion(city) {
  if (!city) return 'south-india';
  const lower = city.toLowerCase().trim();
  const region = CITY_TO_REGION[lower];
  if (!region) console.warn(`  [normalizer] unknown city "${city}" — defaulting region to south-india`);
  return region ?? 'south-india';
}

function normalizePricingRange(raw) {
  if (!raw) return 'mid';
  const str = String(raw).toLowerCase();
  for (const { re, value } of PRICING_RE) {
    if (re.test(str)) return value;
  }
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
 * Normalize a raw scraped vendor into the canonical schema shape.
 * Returns null if required fields are missing.
 * @param {object} raw
 * @param {string} source
 * @returns {object|null}
 */
export function normalizeVendor(raw, source) {
  const name = (raw.name ?? '').trim();
  if (!name) return null;

  const city = (raw.city ?? raw.location ?? '').toLowerCase().trim();
  const category = mapCategory(raw.category ?? raw.type ?? '');
  if (!category) {
    console.warn(`  [normalizer] could not map category "${raw.category ?? raw.type}" for "${name}" — skipping`);
    return null;
  }

  const url = raw.url ?? raw.website;
  if (!url) {
    console.warn(`  [normalizer] missing url for "${name}" — skipping`);
    return null;
  }

  const rawDesc = (raw.description ?? raw.about ?? raw.snippet ?? '').trim();
  const description = (rawDesc || `${name} — ${category} in ${city}`).slice(0, 200);

  return {
    id: slugify(name, city),
    name,
    url,
    description,
    category,
    city,
    region: raw.region ?? inferRegion(city),
    pricing_range: normalizePricingRange(raw.price ?? raw.pricing ?? raw.priceRange ?? ''),
    featured: false,
    verified: false,
    intents: [],
    related: [],
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    submitted_at: new Date().toISOString().split('T')[0],
    _source: source,
  };
}

/**
 * Deduplicate vendors within a batch by id.
 * @param {object[]} vendors
 * @returns {object[]}
 */
export function deduplicateVendors(vendors) {
  const seen = new Set();
  const dupeCount = { n: 0 };
  const result = vendors.filter((v) => {
    if (seen.has(v.id)) { dupeCount.n++; return false; }
    seen.add(v.id);
    return true;
  });
  if (dupeCount.n > 0) process.stderr.write(`  [dedup] removed ${dupeCount.n} duplicate(s)\n`);
  return result;
}
