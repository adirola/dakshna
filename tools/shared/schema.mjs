export const CATEGORIES = ['venue', 'photographer', 'makeup', 'caterer', 'decorator', 'dj', 'pandit', 'planner'];
export const REGIONS = ['south-india', 'north-india', 'east-india', 'west-india', 'international'];
export const PRICING_RANGES = ['budget', 'mid', 'premium', 'luxury'];
export const REQUIRED_FIELDS = ['id', 'name', 'url', 'description', 'category', 'city', 'region', 'pricing_range', 'submitted_at'];
export const OPTIONAL_FIELDS = ['intents', 'related', 'tags', 'featured', 'verified'];

/**
 * Validate a vendor object against the DEV-325 schema.
 * @param {object} obj
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateVendor(obj) {
  const errors = [];

  for (const field of REQUIRED_FIELDS) {
    if (obj[field] === undefined || obj[field] === null || obj[field] === '') {
      errors.push(`${field} is required`);
    }
  }

  if (obj.category && !CATEGORIES.includes(obj.category)) {
    errors.push(`category "${obj.category}" must be one of: ${CATEGORIES.join(', ')}`);
  }
  if (obj.region && !REGIONS.includes(obj.region)) {
    errors.push(`region "${obj.region}" must be one of: ${REGIONS.join(', ')}`);
  }
  if (obj.pricing_range && !PRICING_RANGES.includes(obj.pricing_range)) {
    errors.push(`pricing_range "${obj.pricing_range}" must be one of: ${PRICING_RANGES.join(', ')}`);
  }
  if (obj.url && !/^https?:\/\//i.test(obj.url)) {
    errors.push(`url "${obj.url}" must start with http:// or https://`);
  }
  if (obj.description && obj.description.length > 200) {
    errors.push(`description must be ≤ 200 chars (got ${obj.description.length})`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Convert name + city into a kebab-case slug ID.
 * e.g. "Regal Gardens" + "Bangalore" → "regal-gardens-bangalore"
 * @param {string} name
 * @param {string} city
 * @returns {string}
 */
export function slugify(name, city) {
  return `${name} ${city}`
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-');
}

/**
 * Apply schema defaults to a partial vendor object.
 * @param {object} partial
 * @returns {object}
 */
export function defaultVendor(partial) {
  return {
    featured: false,
    verified: false,
    intents: [],
    related: [],
    tags: [],
    submitted_at: new Date().toISOString().split('T')[0],
    ...partial,
  };
}
