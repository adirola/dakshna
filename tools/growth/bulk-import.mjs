#!/usr/bin/env node
import { Command } from 'commander';
import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { validateVendor } from '../shared/schema.mjs';
import { writeVendorMarkdown } from '../shared/markdown-writer.mjs';

const program = new Command();

program
  .requiredOption('--input <path>', 'Path to JSON array of vendor objects')
  .option('--output <path>', 'Output directory for .md files', './src/content/vendors')
  .option('--dry-run', 'Validate only, do not write files', false)
  .option('--skip-invalid', 'Continue past validation errors instead of stopping', false)
  .parse(process.argv);

const opts = program.opts();

let vendors;
try {
  vendors = JSON.parse(await readFile(opts.input, 'utf8'));
} catch (err) {
  console.error(`Failed to read ${opts.input}: ${err.message}`);
  process.exit(1);
}

if (!Array.isArray(vendors)) {
  console.error('Input must be a JSON array of vendor objects.');
  process.exit(1);
}

console.log(`\nBulk Import — ${vendors.length} vendors from ${opts.input}`);

const results = { valid: 0, invalid: 0, skipped: 0 };

async function fileExists(p) {
  try { await access(p); return true; } catch { return false; }
}

for (const vendor of vendors) {
  const { _source, _rawCategory, ...clean } = vendor;
  const { valid, errors } = validateVendor(clean);

  if (!valid) {
    console.error(`INVALID: ${clean.name ?? '(no name)'} — ${errors.join(', ')}`);
    results.invalid++;
    if (!opts.skipInvalid) {
      console.error('Stopping. Use --skip-invalid to continue past errors.');
      process.exit(1);
    }
    continue;
  }

  const targetPath = join(opts.output, `${clean.id}.md`);
  if (await fileExists(targetPath)) {
    console.warn(`SKIP existing: ${clean.id}`);
    results.skipped++;
    continue;
  }

  if (opts.dryRun) {
    console.log(`[dry-run] Would write: ${clean.id}.md`);
  } else {
    await writeVendorMarkdown(clean, opts.output);
    console.log(`Written: ${clean.id}.md`);
  }
  results.valid++;
}

console.log(`\nSummary: ${results.valid} imported, ${results.skipped} skipped, ${results.invalid} invalid`);
process.exit(results.invalid > 0 ? 1 : 0);
