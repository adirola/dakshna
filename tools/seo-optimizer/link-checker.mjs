#!/usr/bin/env node
/**
 * link-checker.mjs — Crawl internal links in dist/, report broken ones.
 *
 * Usage:
 *   node tools/seo-optimizer/link-checker.mjs --dist ./dist
 *   node tools/seo-optimizer/link-checker.mjs --dist ./dist --format json
 *
 * Checks all <a href="..."> internal links and reports those pointing to
 * non-existent pages (HTTP 404 or missing file).
 */

import { parseArgs } from 'node:util';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const { values } = parseArgs({
  options: {
    dist:   { type: 'string', default: './dist' },
    format: { type: 'string', default: 'text' },
  },
  strict: false,
});

const distDir = values.dist;

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

function extractInternalLinks(html) {
  const links = new Set();
  const re = /href=["'](\/?[^"'#?][^"']*?)["']/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const href = m[1];
    // Only internal absolute paths (start with /)
    if (href.startsWith('/') && !href.startsWith('//')) {
      links.add(href.replace(/[?#].*$/, ''));
    }
  }
  return [...links];
}

function resolveLocalPath(distDir, href) {
  // /vendors/slug → dist/vendors/slug/index.html or dist/vendors/slug.html
  const base = join(distDir, href);
  if (existsSync(join(base, 'index.html'))) return true;
  if (existsSync(base + '.html')) return true;
  if (existsSync(base) && !statSync(base).isDirectory()) return true;
  return false;
}

const htmlFiles = findHtmlFiles(distDir);
const brokenLinks = [];
const checkedLinks = new Map();

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const page = '/' + relative(distDir, file).replace(/\/index\.html$/, '').replace(/\.html$/, '');
  const links = extractInternalLinks(html);

  for (const href of links) {
    if (checkedLinks.has(href)) {
      const ok = checkedLinks.get(href);
      if (!ok) brokenLinks.push({ page, href });
      continue;
    }
    const ok = resolveLocalPath(distDir, href);
    checkedLinks.set(href, ok);
    if (!ok) brokenLinks.push({ page, href });
  }
}

if (values.format === 'json') {
  console.log(JSON.stringify({ total: checkedLinks.size, broken: brokenLinks }, null, 2));
} else {
  console.log(`\nLink Checker — ${htmlFiles.length} pages, ${checkedLinks.size} unique links`);
  if (brokenLinks.length === 0) {
    console.log('No broken internal links found.');
  } else {
    console.log(`\n${brokenLinks.length} broken link(s):`);
    for (const { page, href } of brokenLinks) {
      console.log(`  ${page} → ${href}`);
    }
    process.exitCode = 1;
  }
}
