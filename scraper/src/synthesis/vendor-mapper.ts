import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { config } from '../config.js';

export const VendorSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().url(),
  description: z.string().max(200),
  category: z.enum([
    'venue',
    'photographer',
    'makeup',
    'decorator',
    'caterer',
    'mehendi',
    'dj',
    'choreographer',
    'planner',
    'jewelry',
    'tailor',
    'entertainment',
    'pandit',
    'other',
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
  submitted_at: z.string().datetime(),
});

export type Vendor = z.infer<typeof VendorSchema>;

export interface SynthesisInput {
  markdown: string;
  sourceUrl: string;
  category?: string;
  city?: string;
}

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!client) client = new GoogleGenAI({ apiKey: config.geminiApiKey });
  return client;
}

const SYSTEM_PROMPT = `You are a data extraction agent for Dakshna, a South Asian wedding vendor directory.

Extract one or more vendor listings from the provided scraped markdown content and return a JSON array.
Each vendor object must match this schema exactly:

{
  "id": "<kebab-case-name-city>",
  "name": "<vendor name>",
  "url": "<vendor website URL — use sourceUrl if not found>",
  "description": "<max 200 char description of what they offer>",
  "category": "<one of: venue | photographer | makeup | decorator | caterer | mehendi | dj | choreographer | planner | jewelry | tailor | entertainment | pandit | other>",
  "city": "<city name>",
  "region": "<one of: south-india | north-india | east-india | west-india | international>",
  "intents": ["<relevant intent tags>"],
  "related": [],
  "tags": ["<relevant tags>"],
  "pricing_range": "<one of: budget | mid | premium | luxury>",
  "featured": false,
  "verified": false,
  "submitted_at": "<ISO 8601 datetime>"
}

Rules:
- Only include vendors with a name, city, and plausible category.
- Description must be ≤200 chars, factual, not promotional.
- Infer region from city (e.g. Mumbai → west-india, Delhi → north-india, Chennai → south-india, Kolkata → east-india).
- Infer pricing_range from cues in the text; default to "mid" if unknown.
- submitted_at must be today's date in ISO 8601 (${new Date().toISOString()}).
- Return ONLY valid JSON, no markdown fences.`;

function buildPrompt(input: SynthesisInput): string {
  const hints = [];
  if (input.category) hints.push(`Category hint: ${input.category}`);
  if (input.city) hints.push(`City hint: ${input.city}`);

  return `Source URL: ${input.sourceUrl}
${hints.join('\n')}

Scraped content:
${input.markdown.slice(0, 8000)}`;
}

async function synthesizeOnce(input: SynthesisInput): Promise<unknown[]> {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: config.geminiModel,
    contents: buildPrompt(input),
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.2,
    },
  });

  const text = response.text ?? '';
  const trimmed = text.trim();
  const jsonText = trimmed.startsWith('[') ? trimmed : trimmed.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
  return JSON.parse(jsonText) as unknown[];
}

export async function synthesizeVendors(input: SynthesisInput): Promise<Vendor[]> {
  const MAX_RETRIES = 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const raw = await synthesizeOnce(input);
      const vendors: Vendor[] = [];
      for (const item of raw) {
        const parsed = VendorSchema.safeParse(item);
        if (parsed.success) {
          vendors.push(parsed.data);
        } else {
          console.warn(`Skipping invalid vendor entry: ${parsed.error.message}`);
        }
      }
      if (vendors.length > 0) return vendors;
      throw new Error('No valid vendor entries extracted');
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < MAX_RETRIES) {
        console.warn(`Synthesis attempt ${attempt + 1} failed, retrying...`);
      }
    }
  }

  throw lastError ?? new Error('Synthesis failed after retries');
}
