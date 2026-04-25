#!/usr/bin/env node
/**
 * meta-audit.mjs — Check each built HTML page for SEO meta requirements.
 *
 * Usage:
 *   node tools/seo-optimizer/meta-audit.mjs --dist ./dist
 *   node tools/seo-optimizer/meta-audit.mjs --dist ./dist --format json
 *
 * Checks per page:
 *   - <title> exists and is non-empty
 *   - <meta name="description"> present with content ≥ 50 chars
 *   - <meta property="og:title"> present
 *   - <meta property="og:description"> present
 *   - <meta property="og:image"> present
 *   - <link rel="canonical"> present
 *   - <script type="application/ld+json"> present
 */

import { parseArgs } from 'node:util';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const { values } = parseArgs({
  options: {
    dist:   { type: 'string', default: './dist' },
    format: { type: 'string', default: 'text' },
  },
  strict: false,
});

const distDir = values.dist;
const format = values.format;

const HTML_CHECKS = [
  { id: 'title', label: 'Title tag', re: /<title[^>]*>([^<]{2,})<\/title>/i, extract: true },
  { id: 'description', label: 'Meta description ≥50 chars', re: /<meta\s+name=["']description["'][^>]+content=["']([^"']{50,})["']/i },
  { id: 'og_title', label: 'og:title', re: /<meta\s+property=["']og:title["'][^>]+content=["'][^"']{2,}["']/i },
  { id: 'og_description', label: 'og:description', re: /<meta\s+property=["']og:description["'][^>]+content=["'][^"']{2,}["']/i },
  { id: 'og_image', label: 'og:image', re: /<meta\s+property=["']og:image["'][^>]+content=["'][^"']{2,}["']/i },
  { id: 'canonical', label: 'Canonical link', re: /<link\s+rel=["']canonical["'][^>]+href=["'][^"']{2,}["']/i },
  { id: 'jsonld', label: 'JSON-LD script', re: /<script\s+type=["']application\/ld\+json["']/i },
];

function findHtmlFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) files.push(...findHtmlFiles(full));
    else if (entry.endsWith('.html')) files.push(full);
  }
  return files;
}

const htmlFiles = findHtmlFiles(distDir);
const results = [];

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const page = relative(distDir, file);
  const checks = {};
  let score = 0;

  for (const check of HTML_CHECKS) {
    const pass = check.re.test(html);
    checks[check.id] = pass;
    if (pass) score++;
  }

  results.push({ page, score, total: HTML_CHECKS.length, checks });
}

results.sort((a, b) => a.score - b.score);

if (format === 'json') {
  console.log(JSON.stringify(results, null, 2));
} else {
  const failing = results.filter((r) => r.score < r.total);
  const passing = results.filter((r) => r.score === r.total);

  console.log(`\nMeta Audit — ${htmlFiles.length} pages`);
  console.log(`  Passing: ${passing.length}  Failing: ${failing.length}\n`);

  if (failing.length > 0) {
    console.log('Pages with missing SEO elements:');
    for (const r of failing) {
      const missing = HTML_CHECKS.filter((c) => !r.checks[c.id]).map((c) => c.label);
      console.log(`  ${r.page} (${r.score}/${r.total})`);
      for (const m of missing) console.log(`    ✗ ${m}`);
    }
  } else {
    console.log('All pages pass SEO meta checks.');
  }

  if (process.exitCode === undefined && failing.length > 0) process.exitCode = 1;
}
