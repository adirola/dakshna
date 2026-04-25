#!/usr/bin/env node
import { Command } from 'commander';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATEGORIES } from '../shared/schema.mjs';
import { normalizeVendor, deduplicateVendors } from './lib/normalizer.mjs';
import { writeJson, writeMarkdownFiles } from './lib/output.mjs';
import { getScraperConfig } from '../shared/config.mjs';

const __dir = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = resolve(__dir, '../../');

const program = new Command();

program
  .requiredOption('--source <source>', 'google-maps | justdial | sulekha | indiamart')
  .requiredOption('--city <city>', 'City name to search')
  .requiredOption('--category <category>', `Vendor category (${CATEGORIES.join(', ')})`)
  .option('--limit <n>', 'Max results to fetch', '50')
  .option('--output-dir <path>', 'Directory for raw JSON output', 'data/vendors-raw/')
  .option('--write-md', 'Also write .md files to src/content/vendors/', false)
  .option('--dry-run', 'Log only, no file writes', false)
  .parse(process.argv);

const opts = program.opts();

if (!CATEGORIES.includes(opts.category)) {
  console.error(`Invalid category "${opts.category}". Must be one of: ${CATEGORIES.join(', ')}`);
  process.exit(1);
}

const SOURCES = {
  'google-maps': './sources/google-maps.mjs',
  justdial: './sources/justdial.mjs',
  sulekha: './sources/sulekha.mjs',
  indiamart: './sources/indiamart.mjs',
};

if (!SOURCES[opts.source]) {
  console.error(`Unknown source "${opts.source}". Must be one of: ${Object.keys(SOURCES).join(', ')}`);
  process.exit(1);
}

const limit = parseInt(opts.limit, 10) || 50;
const config = getScraperConfig();

const sourceModule = await import(SOURCES[opts.source]);
const raw = await sourceModule.scrape({ city: opts.city, category: opts.category, limit, config });

const normalized = raw.map((r) => normalizeVendor(r, opts.source)).filter(Boolean);
const vendors = deduplicateVendors(normalized);

const date = new Date().toISOString().slice(0, 10);
const outputPath = join(opts.outputDir, `${opts.source}-${opts.city.toLowerCase()}-${opts.category}-${date}.json`);

console.log(`\nScraped ${raw.length}, normalized ${normalized.length}, deduplicated to ${vendors.length}`);

if (opts.dryRun) {
  console.log('[dry-run] Would write:');
  console.log(`  JSON → ${outputPath}`);
  if (opts.writeMd) console.log(`  .md files → src/content/vendors/`);
  vendors.slice(0, 5).forEach((v) => console.log(`  ${v.id} (${v.category}, ${v.city})`));
  process.exit(0);
}

await writeJson(vendors, outputPath);
console.log(`JSON written → ${outputPath}`);

if (opts.writeMd) {
  const mdDir = join(repoRoot, 'src/content/vendors');
  const { written, skipped } = await writeMarkdownFiles(vendors, mdDir);
  console.log(`.md files: ${written} written, ${skipped} skipped`);
}
