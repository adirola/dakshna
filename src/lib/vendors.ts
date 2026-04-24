import type { Vendor } from '../content.config';

export const CATEGORY_LABELS: Record<Vendor['category'], string> = {
  venue: 'Venues',
  photographer: 'Photographers',
  makeup: 'Makeup Artists',
  caterer: 'Caterers',
  decorator: 'Decorators',
  dj: 'DJs',
  pandit: 'Pandits',
  planner: 'Planners',
};

export const PRICING_LABELS: Record<Vendor['pricingRange'], string> = {
  budget: 'Budget',
  mid: 'Mid-Range',
  premium: 'Premium',
  luxury: 'Luxury',
};
