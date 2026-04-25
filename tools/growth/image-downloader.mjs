#!/usr/bin/env node
/**
 * image-downloader.mjs — Download and optimize vendor images.
 *
 * Usage:
 *   node tools/growth/image-downloader.mjs \
 *     --images ./data/vendor-images.json \
 *     --output ./public/vendors
 *
 * Input JSON format:
 *   { [vendorSlug]: ["https://example.com/img1.jpg", ...] }
 *
 * Requires: sharp (install with npm install sharp)
 */

import { parseArgs } from 'node:util';
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const { values } = parseArgs({
  options: {
    images:  { type: 'string', default: './data/vendor-images.json' },
    output:  { type: 'string', default: './public/vendors' },
    width:   { type: 'string', default: '800' },
    quality: { type: 'string', default: '80' },
  },
  strict: false,
});

if (!existsSync(values.images)) {
  console.error(`Images manifest not found: ${values.images}`);
  console.error('Expected format: { "vendor-slug": ["https://...img1.jpg"] }');
  process.exit(1);
}

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.error('sharp is not installed. Run: npm install sharp');
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(values.images, 'utf8'));
const width = parseInt(values.width, 10) || 800;
const quality = parseInt(values.quality, 10) || 80;
let downloaded = 0;
let skipped = 0;
let errors = 0;

for (const [slug, urls] of Object.entries(manifest)) {
  const slugDir = join(values.output, slug);
  mkdirSync(slugDir, { recursive: true });

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const outPath = join(slugDir, `${i + 1}.webp`);

    if (existsSync(outPath)) { skipped++; continue; }

    try {
      const res = await fetch(url);
      if (!res.ok) { console.warn(`  ✗ ${url} (HTTP ${res.status})`); errors++; continue; }

      const buffer = Buffer.from(await res.arrayBuffer());
      await sharp(buffer)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality })
        .toFile(outPath);

      console.log(`  ✓ ${slug}/${i + 1}.webp`);
      downloaded++;
    } catch (err) {
      console.warn(`  ✗ ${slug}[${i}]: ${err.message}`);
      errors++;
    }
  }
}

console.log(`\nDone. Downloaded: ${downloaded}, Skipped: ${skipped}, Errors: ${errors}`);
