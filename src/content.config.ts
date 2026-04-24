import { defineCollection, z } from 'astro:content';

export const vendorSchema = z.object({
  slug: z.string(),
  name: z.string(),
  category: z.enum(['venue', 'photographer', 'makeup', 'caterer', 'decorator', 'dj', 'pandit', 'planner']),
  city: z.string(),
  description: z.string(),
  pricingRange: z.enum(['budget', 'mid', 'premium', 'luxury']),
  featured: z.boolean().optional(),
  verified: z.boolean().optional(),
});

export type Vendor = z.infer<typeof vendorSchema>;

export const collections = {
  vendors: defineCollection({ type: 'data', schema: vendorSchema }),
};
