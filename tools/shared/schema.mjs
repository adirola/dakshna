/**
 * Vendor schema constraints for Node.js CLI tools.
 * Mirrors src/content.config.ts — keep in sync manually.
 */

export const CATEGORIES = ['venue', 'photographer', 'makeup', 'caterer', 'decorator', 'dj', 'pandit', 'planner'];

export const PRICING_RANGES = ['budget', 'mid', 'premium', 'luxury'];

// Slug: lowercase kebab-case, letters + numbers only
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Validate a vendor object against the schema.
 * Returns { valid: true } or { valid: false, errors: string[] }.
 */
export function validateVendor(vendor) {
  const errors = [];

  if (!vendor.slug || !SLUG_RE.test(vendor.slug)) {
    errors.push(`slug "${vendor.slug}" must be kebab-case alphanumeric (e.g. "regal-gardens-bangalore")`);
  }
  if (!vendor.name || typeof vendor.name !== 'string' || vendor.name.length > 120) {
    errors.push('name is required, must be a string ≤ 120 chars');
  }
  if (!CATEGORIES.includes(vendor.category)) {
    errors.push(`category "${vendor.category}" must be one of: ${CATEGORIES.join(', ')}`);
  }
  if (!vendor.city || typeof vendor.city !== 'string') {
    errors.push('city is required');
  }
  if (!vendor.description || typeof vendor.description !== 'string' || vendor.description.length > 500) {
    errors.push('description is required, must be a string ≤ 500 chars');
  }
  if (!PRICING_RANGES.includes(vendor.pricingRange)) {
    errors.push(`pricingRange "${vendor.pricingRange}" must be one of: ${PRICING_RANGES.join(', ')}`);
  }
  if (vendor.url !== undefined && vendor.url !== null) {
    try { new URL(vendor.url); } catch { errors.push(`url "${vendor.url}" is not a valid URL`); }
  }
  if (vendor.tags !== undefined && !Array.isArray(vendor.tags)) {
    errors.push('tags must be an array');
  }
  if (vendor.related !== undefined && !Array.isArray(vendor.related)) {
    errors.push('related must be an array');
  }

  return errors.length === 0 ? { valid: true } : { valid: false, errors };
}

/**
 * Convert an arbitrary string to a valid slug.
 * e.g. "Regal Gardens Bangalore!" → "regal-gardens-bangalore"
 */
export function toSlug(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-');
}

/**
 * Apply schema defaults to a vendor object (matches Astro collection defaults).
 */
export function applyDefaults(vendor) {
  return {
    tags: [],
    related: [],
    featured: false,
    verified: false,
    ...vendor,
  };
}
