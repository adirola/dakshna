#!/usr/bin/env node
/**
 * Classified Hunter CLI
 *
 * Usage:
 *   node tools/classified-hunter/index.mjs --source justdial --city bangalore --category venue --limit 50
 *   node tools/classified-hunter/index.mjs --source all --city mumbai --category photographer
 *
 * Options:
 *   --source     justdial | sulekha | indiamart | google | all  (default: all)
 *   --city       City name (required)
 *   --category   venue | photographer | makeup | caterer | decorator | dj | pandit | planner (required)
 *   --limit      Max results per source (default: 20)
 *   --output-dir Path to src/content/vendors/ (default: ./src/content/vendors)
 *   --batch-dir  Path for batch JSON output (default: ./data/hunts)
 *   --no-write   Skip writing individual vendor files (only saves batch JSON)
 */

import { parseArgs } from 'node:util';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATEGORIES } from '../shared/schema.mjs';
import { deduplicate } from './lib/normalizer.mjs';
import { saveResults, printSummary } from './lib/output.mjs';

const __dir = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = resolve(__dir, '../../');

const { values } = parseArgs({
  options: {
    source:     { type: 'string', default: 'all' },
    city:       { type: 'string' },
    category:   { type: 'string' },
    limit:      { type: 'string', default: '20' },
    'output-dir': { type: 'string', default: join(repoRoot, 'src/content/vendors') },
    'batch-dir':  { type: 'string', default: join(repoRoot, 'data/hunts') },
    'no-write': { type: 'boolean', default: false },
  },
  strict: false,
});

const { city, category } = values;

if (!city || !category) {
  console.error('Usage: node tools/classified-hunter/index.mjs --city <city> --category <category> [options]');
  process.exit(1);
}

if (!CATEGORIES.includes(category)) {
  console.error(`Invalid category "${category}". Must be one of: ${CATEGORIES.join(', ')}`);
  process.exit(1);
}

const limit = parseInt(values.limit, 10) || 20;
const outputDir = values['output-dir'];
const batchDir = values['batch-dir'];
const writeIndividual = !values['no-write'];

const SOURCES = {
  justdial: () => import('./sources/justdial.mjs').then((m) => m.scrapeJustDial({ city, category, limit })),
  sulekha: () => import('./sources/sulekha.mjs').then((m) => m.scrapeSulekha({ city, category, limit })),
  indiamart: () => import('./sources/indiamart.mjs').then((m) => m.scrapeIndiamart({ city, category, limit })),
  google: () => import('./sources/google-maps.mjs').then((m) => m.scrapeGoogleMaps({ city, category, limit })),
};

const selectedSources = values.source === 'all' ? Object.keys(SOURCES) : [values.source];

const unknownSources = selectedSources.filter((s) => !SOURCES[s]);
if (unknownSources.length) {
  console.error(`Unknown source(s): ${unknownSources.join(', ')}. Valid: ${Object.keys(SOURCES).join(', ')}, all`);
  process.exit(1);
}

console.log(`\nClassified Hunter`);
console.log(`  city:     ${city}`);
console.log(`  category: ${category}`);
console.log(`  sources:  ${selectedSources.join(', ')}`);
console.log(`  limit:    ${limit} per source`);

const allVendors = [];

for (const source of selectedSources) {
  console.log(`\n[${source}] Scraping...`);
  try {
    const results = await SOURCES[source]();
    printSummary(results, source);
    allVendors.push(...results);
  } catch (err) {
    console.error(`[${source}] Error: ${err.message}`);
  }
}

const deduped = deduplicate(allVendors);
console.log(`\nTotal unique vendors: ${deduped.length} (from ${allVendors.length} raw results)`);

const datestamp = new Date().toISOString().slice(0, 10);
const batchFile = join(batchDir, `hunt-${datestamp}-${category}-${city.toLowerCase()}.json`);

saveResults(deduped, { outputDir, batchFile, writeIndividual });

console.log('\nDone.');
