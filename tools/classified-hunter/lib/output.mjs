/**
 * Output helpers for classified-hunter: write JSON array + individual vendor files.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { writeVendors } from '../../shared/json-writer.mjs';

/**
 * Save results: JSON batch file + individual vendor files.
 * @param {object[]} vendors - normalized vendor objects
 * @param {object} opts
 * @param {string} opts.outputDir - path to src/content/vendors/
 * @param {string} opts.batchFile - path for the JSON batch output (e.g. data/hunt-2026-04-25.json)
 * @param {boolean} [opts.writeIndividual=true] - write individual vendor JSON files
 */
export function saveResults(vendors, { outputDir, batchFile, writeIndividual = true }) {
  // Always write the batch JSON (raw output before any editing)
  mkdirSync(batchFile.replace(/\/[^/]+$/, ''), { recursive: true });
  writeFileSync(batchFile, JSON.stringify(vendors, null, 2) + '\n', 'utf8');
  console.log(`\nBatch saved → ${batchFile} (${vendors.length} vendors)`);

  if (writeIndividual) {
    console.log(`\nWriting to ${outputDir}:`);
    const { written, skipped } = writeVendors(vendors, outputDir);
    console.log(`  ${written} written, ${skipped} skipped (validation errors)`);
  }
}

/**
 * Print a summary table to stdout.
 */
export function printSummary(vendors, source) {
  console.log(`\n── ${source} results (${vendors.length}) ──────────────────`);
  for (const v of vendors.slice(0, 10)) {
    console.log(`  ${v.slug.padEnd(40)} ${v.category.padEnd(12)} ${v.city}`);
  }
  if (vendors.length > 10) {
    console.log(`  … and ${vendors.length - 10} more`);
  }
}
