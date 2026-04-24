import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

interface VendorRecord {
  name: string;
  category: string;
  city: string;
  region: string;
  pricing_range: string;
  intents: string[];
  related: string[];
}

interface IntentEntry {
  vendors: string[];
  related_intents: string[];
}

function slugify(city: string): string {
  return city
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export const GET: APIRoute = async () => {
  const vendors = await getCollection('vendors');

  const intentIndex = new Map<string, Set<string>>();
  const vendorRecords: Record<string, VendorRecord> = {};

  for (const vendor of vendors) {
    const id = vendor.id.replace(/\.md$/, '');
    const { data } = vendor;
    const { name, category, city, region, pricing_range, intents: manual = [], related = [] } = data;

    const citySlug = slugify(city);
    const autoIntents = [
      `find-${citySlug}-${category}`,
      `find-${region}-${category}`,
      `find-${pricing_range}-${category}`,
    ];
    const allIntents = [...new Set([...autoIntents, ...manual])];

    for (const intent of allIntents) {
      if (!intentIndex.has(intent)) intentIndex.set(intent, new Set());
      intentIndex.get(intent)!.add(id);
    }

    vendorRecords[id] = { name, category, city: citySlug, region, pricing_range, intents: allIntents, related };
  }

  const intents: Record<string, IntentEntry> = {};
  for (const [intentKey, vendorSet] of intentIndex) {
    const vendorIds = [...vendorSet];
    const relatedSet = new Set<string>();
    for (const vendorId of vendorIds) {
      for (const otherIntent of vendorRecords[vendorId].intents) {
        if (otherIntent !== intentKey) relatedSet.add(otherIntent);
      }
    }
    intents[intentKey] = { vendors: vendorIds, related_intents: [...relatedSet] };
  }

  return new Response(
    JSON.stringify(
      { version: '1.0', generated_at: new Date().toISOString(), intents, vendors: vendorRecords },
      null,
      2
    ),
    { headers: { 'Content-Type': 'application/json' } }
  );
};
