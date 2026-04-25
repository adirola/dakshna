import type { CollectionEntry } from 'astro:content';

export const CATEGORY_LABELS: Record<string, string> = {
  venue: 'Venues',
  photographer: 'Photographers',
  makeup: 'Makeup Artists',
  caterer: 'Caterers',
  decorator: 'Decorators',
  dj: 'DJs',
  pandit: 'Pandits',
  planner: 'Planners',
};

export const PRICING_LABELS: Record<string, string> = {
  budget: 'Budget',
  mid: 'Mid-Range',
  premium: 'Premium',
  luxury: 'Luxury',
};

export function sortVendorsFeaturedFirst(vendors: CollectionEntry<'vendors'>[]) {
  return vendors.slice().sort((a, b) => (b.data.featured ? 1 : 0) - (a.data.featured ? 1 : 0));
}

export function getFeaturedVendors(vendors: CollectionEntry<'vendors'>[], limit = 8) {
  return vendors.filter((v) => v.data.featured).slice(0, limit);
}
