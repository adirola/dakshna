import { defineCollection, z } from 'astro:content';

const vendors = defineCollection({
  type: 'content',
  schema: z.object({
    id: z.string(),
    name: z.string(),
    url: z.string().url(),
    description: z.string().max(200),
    category: z.enum([
      'venue',
      'photographer',
      'makeup',
      'caterer',
      'decorator',
      'dj',
      'pandit',
      'planner',
    ]),
    city: z.string(),
    region: z.enum([
      'south-india',
      'north-india',
      'east-india',
      'west-india',
      'international',
    ]),
    intents: z.array(z.string()).optional().default([]),
    related: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    pricing_range: z.enum(['budget', 'mid', 'premium', 'luxury']),
    featured: z.boolean().default(false),
    verified: z.boolean().default(false),
    submitted_at: z.coerce.date(),
  }),
});

export const collections = { vendors };
