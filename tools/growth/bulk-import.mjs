#!/usr/bin/env node
/**
 * bulk-import.mjs — Import classified-hunter JSON output into src/content/vendors/.
 * Validates each entry against the schema and skips invalid ones.
 *
 * Usage:
 *   node tools/growth/bulk-import.mjs \
 *     --input ./data/hunts/hunt-2026-04-25-venue-bangalore.json \
 *     --output ./src/content/vendors
 *
 *   # Dry run (validate only, don't write files)
 *   node tools/growth/bulk-import.mjs --input ./data/hunts/hunt.json --dry-run
 *
 *   # Skip duplicates that already exist
 *   node tools/growth/bulk-import.mjs --input ./data/hunts/hunt.json --skip-existing
 */

import { parseArgs } from 'node:util';
import { readFileSync, existsSync } from 'node:fs';
import { writeVendors } from '../shared/json-writer.mjs';
import { validateVendor, applyDefaults } from '../shared/schema.mjs';
import { join } from 'node:path';

const { values } = parseArgs({
  options: {
    input:          { type: 'string' },
    output:         { type: 'string', default: './src/content/vendors' },
    'dry-run':      { type: 'boolean', default: false },
    'skip-existing': { type: 'boolean', default: true },
  },
  strict: false,
});

if (!values.input) {
  console.error('Usage: node tools/growth/bulk-import.mjs --input <batch.json>');
  process.exit(1);
}

if (!existsSync(values.input)) {
  console.error(`File not found: ${values.input}`);
  process.exit(1);
}

const batch = JSON.parse(readFileSync(values.input, 'utf8'));
if (!Array.isArray(batch)) {
  console.error('Input must be a JSON array of vendor objects.');
  process.exit(1);
}

console.log(`\nBulk Import — ${batch.length} vendors from ${values.input}`);

let valid = 0;
let invalid = 0;
let existing = 0;
const toWrite = [];

for (const raw of batch) {
  // Remove internal scraper fields before writing
  const { _source, _rawCategory, ...vendor } = raw;
  const withDefaults = applyDefaults(vendor);
  const { valid: isValid, errors } = validateVendor(withDefaults);

  if (!isValid) {
    console.warn(`  ✗ ${raw.slug ?? '(no slug)'}: ${errors?.join('; ')}`);
    invalid++;
    continue;
  }

  const outPath = join(values.output, `${withDefaults.slug}.json`);
  if (values['skip-existing'] && existsSync(outPath)) {
    console.log(`  ~ ${withDefaults.slug} (exists, skipped)`);
    existing++;
    continue;
  }

  toWrite.push(withDefaults);
  valid++;
}

console.log(`\n  Valid: ${valid}  Invalid: ${invalid}  Skipped (existing): ${existing}`);

if (values['dry-run']) {
  console.log('\nDry run — no files written.');
  process.exit(invalid > 0 ? 1 : 0);
}

if (toWrite.length > 0) {
  console.log(`\nWriting ${toWrite.length} vendor file(s) to ${values.output}:`);
  writeVendors(toWrite, values.output);
}

console.log('\nDone.');
process.exit(invalid > 0 ? 1 : 0);
