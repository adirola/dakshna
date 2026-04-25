#!/usr/bin/env node
/**
 * jsonld-gen.mjs — Generate LocalBusiness JSON-LD snippets for each vendor.
 *
 * Usage:
 *   node tools/seo-optimizer/jsonld-gen.mjs --vendors ./src/content/vendors --output ./data/jsonld
 *   node tools/seo-optimizer/jsonld-gen.mjs --vendors ./src/content/vendors --stdout
 *
 * Outputs one .jsonld file per vendor (or prints all to stdout with --stdout).
 * These snippets can be inlined into vendor detail pages via the JsonLd component.
 */

import { parseArgs } from 'node:util';
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const { values } = parseArgs({
  options: {
    vendors: { type: 'string', default: './src/content/vendors' },
    output:  { type: 'string', default: './data/jsonld' },
    stdout:  { type: 'boolean', default: false },
  },
  strict: false,
});

const CATEGORY_TYPES = {
  venue: 'EventVenue',
  photographer: 'LocalBusiness',
  makeup: 'BeautySalon',
  caterer: 'FoodEstablishment',
  decorator: 'LocalBusiness',
  dj: 'EntertainmentBusiness',
  pandit: 'LocalBusiness',
  planner: 'LocalBusiness',
};

const SITE = 'https://dakshna.com';

function buildJsonLd(vendor) {
  const type = CATEGORY_TYPES[vendor.category] ?? 'LocalBusiness';
  const ld = {
    '@context': 'https://schema.org',
    '@type': type,
    name: vendor.name,
    description: vendor.description,
    address: {
      '@type': 'PostalAddress',
      addressLocality: vendor.city,
      addressCountry: 'IN',
    },
    url: vendor.url ?? `${SITE}/vendors/${vendor.slug}`,
  };

  if (type === 'FoodEstablishment') {
    ld.servesCuisine = 'Indian';
  }

  return ld;
}

const vendorDir = values.vendors;
const files = readdirSync(vendorDir).filter((f) => f.endsWith('.json'));

if (!values.stdout) {
  mkdirSync(values.output, { recursive: true });
}

const all = [];

for (const file of files) {
  const vendor = JSON.parse(readFileSync(join(vendorDir, file), 'utf8'));
  const ld = buildJsonLd(vendor);

  if (values.stdout) {
    all.push(ld);
  } else {
    const outPath = join(values.output, file.replace('.json', '.jsonld'));
    writeFileSync(outPath, JSON.stringify(ld, null, 2) + '\n', 'utf8');
    console.log(`  ✓ ${outPath}`);
  }
}

if (values.stdout) {
  console.log(JSON.stringify(all, null, 2));
} else {
  console.log(`\nGenerated ${files.length} JSON-LD snippets → ${values.output}`);
}
