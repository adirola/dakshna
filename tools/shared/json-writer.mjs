/**
 * Write vendor objects to JSON files in src/content/vendors/.
 * Each vendor gets its own file named `{slug}.json`.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { validateVendor, applyDefaults } from './schema.mjs';

/**
 * Write a single vendor to disk.
 * @param {object} vendor - vendor data (must include `slug`)
 * @param {string} outputDir - absolute path to src/content/vendors/
 * @returns {{ written: boolean, path: string, errors?: string[] }}
 */
export function writeVendor(vendor, outputDir) {
  const withDefaults = applyDefaults(vendor);
  const { valid, errors } = validateVendor(withDefaults);

  if (!valid) {
    return { written: false, path: '', errors };
  }

  mkdirSync(outputDir, { recursive: true });

  const filePath = join(outputDir, `${withDefaults.slug}.json`);
  const json = JSON.stringify(withDefaults, null, 2) + '\n';
  writeFileSync(filePath, json, 'utf8');

  return { written: true, path: filePath };
}

/**
 * Write multiple vendors, skipping invalid ones.
 * Prints a summary to stdout.
 * @param {object[]} vendors
 * @param {string} outputDir
 * @returns {{ written: number, skipped: number }}
 */
export function writeVendors(vendors, outputDir) {
  let written = 0;
  let skipped = 0;

  for (const vendor of vendors) {
    const result = writeVendor(vendor, outputDir);
    if (result.written) {
      console.log(`  ✓ ${vendor.slug}.json`);
      written++;
    } else {
      console.warn(`  ✗ ${vendor.slug ?? '(no slug)'} — ${result.errors?.join('; ')}`);
      skipped++;
    }
  }

  return { written, skipped };
}
