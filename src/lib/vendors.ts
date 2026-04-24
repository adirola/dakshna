import type { Vendor } from '../content.config';
import type { CollectionEntry } from 'astro:content';

export const CATEGORY_LABELS: Record<string, string> = {
  venue: 'Wedding Venues',
  photographer: 'Photographers & Videographers',
  makeup: 'Makeup Artists',
  caterer: 'Caterers',
  decorator: 'Decorators & Florists',
  dj: 'DJs & Live Music',
  pandit: 'Pandits & Priests',
  planner: 'Wedding Planners',
};

export const PRICING_ORDER = ['budget', 'mid', 'premium', 'luxury'];

export const PRICING_LABELS: Record<string, string> = {
  budget: 'Budget',
  mid: 'Mid-Range',
  premium: 'Premium',
  luxury: 'Luxury',
};

export function sortVendorsFeaturedFirst(
  vendors: CollectionEntry<'vendors'>[],
): CollectionEntry<'vendors'>[] {
  return vendors.slice().sort((a, b) => (b.data.featured ? 1 : 0) - (a.data.featured ? 1 : 0));
}

export function getFeaturedVendors(
  vendors: CollectionEntry<'vendors'>[],
  limit: number,
): CollectionEntry<'vendors'>[] {
  return vendors.filter((v) => v.data.featured).slice(0, limit);
}
