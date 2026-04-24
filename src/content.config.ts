import { defineCollection, z } from 'astro:content';

export const vendorSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().max(120),
  category: z.enum(['venue', 'photographer', 'makeup', 'caterer', 'decorator', 'dj', 'pandit', 'planner']),
  city: z.string(),
  region: z.string().optional(),
  description: z.string().max(500),
  pricingRange: z.enum(['budget', 'mid', 'premium', 'luxury']),
  url: z.string().url().refine((url) => /^https?:\/\//i.test(url), 'Must use http or https').optional(),
  tags: z.array(z.string()).default([]),
  related: z.array(z.string()).default([]),
  featured: z.boolean().optional(),
  verified: z.boolean().optional(),
});

export type Vendor = z.infer<typeof vendorSchema>;

export const collections = {
  vendors: defineCollection({ type: 'data', schema: vendorSchema }),
};
