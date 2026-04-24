import { defineCollection, z } from 'astro:content';

export const vendorSchema = z.object({
  slug: z.string(),
  name: z.string(),
  category: z.enum(['venue', 'photographer', 'makeup', 'caterer', 'decorator', 'dj', 'pandit', 'planner']),
  city: z.string(),
  region: z.string().optional(),
  description: z.string(),
  pricingRange: z.enum(['budget', 'mid', 'premium', 'luxury']),
  url: z.string().url().optional(),
  tags: z.array(z.string()).default([]),
  related: z.array(z.string()).default([]),
  featured: z.boolean().optional(),
  verified: z.boolean().optional(),
});

export type Vendor = z.infer<typeof vendorSchema>;

export const collections = {
  vendors: defineCollection({ type: 'data', schema: vendorSchema }),
};
