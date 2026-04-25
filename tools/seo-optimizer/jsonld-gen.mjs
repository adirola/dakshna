#!/usr/bin/env node
import { Command } from 'commander';
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import matter from 'gray-matter';

const program = new Command();

program
  .option('--vendors <path>', 'Path to src/content/vendors/', './src/content/vendors')
  .option('--output <path>', 'Directory for .json output', './data/jsonld')
  .parse(process.argv);

const opts = program.opts();

const CATEGORY_TYPES = {
  venue: 'EventVenue',
  photographer: 'Photographer',
  makeup: 'BeautySalon',
  caterer: 'FoodEstablishment',
  decorator: 'HomeAndConstructionBusiness',
  dj: 'MusicGroup',
  pandit: 'ReligiousOrganization',
  planner: 'LocalBusiness',
};

const SITE = 'https://dakshna.com';

export function vendorToLocalBusiness(vendor) {
  const type = CATEGORY_TYPES[vendor.category] ?? 'LocalBusiness';
  const ld = {
    '@context': 'https://schema.org',
    '@type': type,
    name: vendor.name,
    description: vendor.description,
    url: vendor.url ?? `${SITE}/vendors/${vendor.id}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: vendor.city,
      addressCountry: 'IN',
    },
  };
  if (type === 'FoodEstablishment') ld.servesCuisine = 'Indian';
  return ld;
}

export async function generateAllJsonld(vendorsDir, outputDir) {
  const files = (await readdir(vendorsDir)).filter((f) => f.endsWith('.md') && f !== '.gitkeep');
  await mkdir(outputDir, { recursive: true });
  let count = 0;
  for (const file of files) {
    const raw = await readFile(join(vendorsDir, file), 'utf8');
    const { data: vendor } = matter(raw);
    const ld = vendorToLocalBusiness(vendor);
    const outPath = join(outputDir, `${vendor.id}.json`);
    await writeFile(outPath, JSON.stringify(ld, null, 2) + '\n', 'utf8');
    console.log(`  ✓ ${outPath}`);
    count++;
  }
  return count;
}

const count = await generateAllJsonld(opts.vendors, opts.output);
console.log(`\nGenerated ${count} JSON-LD snippets → ${opts.output}`);
