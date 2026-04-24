import type { Vendor } from '../content.config';

export const CATEGORIES: { id: Vendor['category']; label: string }[] = [
  { id: 'venue', label: 'Venues' },
  { id: 'photographer', label: 'Photographers' },
  { id: 'makeup', label: 'Makeup' },
  { id: 'caterer', label: 'Caterers' },
  { id: 'decorator', label: 'Decorators' },
  { id: 'dj', label: 'DJs' },
  { id: 'pandit', label: 'Pandits' },
  { id: 'planner', label: 'Planners' },
];

export const FEATURED_CITIES: { slug: string; displayName: string }[] = [
  { slug: 'bangalore', displayName: 'Bangalore' },
  { slug: 'delhi', displayName: 'Delhi' },
  { slug: 'mumbai', displayName: 'Mumbai' },
  { slug: 'chennai', displayName: 'Chennai' },
  { slug: 'hyderabad', displayName: 'Hyderabad' },
  { slug: 'pune', displayName: 'Pune' },
  { slug: 'kolkata', displayName: 'Kolkata' },
  { slug: 'jaipur', displayName: 'Jaipur' },
];
