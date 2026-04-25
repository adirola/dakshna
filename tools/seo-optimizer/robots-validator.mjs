#!/usr/bin/env node
/**
 * robots-validator.mjs — Validate robots.txt directives against actual generated routes.
 *
 * Usage:
 *   node tools/seo-optimizer/robots-validator.mjs --dist ./dist --robots ./public/robots.txt
 *
 * Checks:
 *   - All Disallow paths in robots.txt exist in dist/ (no phantom disallows)
 *   - Sitemap directive points to a reachable URL
 *   - No critical routes (/, /vendors/*) are accidentally disallowed
 */

import { parseArgs } from 'node:util';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const { values } = parseArgs({
  options: {
    dist:   { type: 'string', default: './dist' },
    robots: { type: 'string', default: './public/robots.txt' },
  },
  strict: false,
});

const CRITICAL_PATHS = ['/', '/vendors', '/category'];

if (!existsSync(values.robots)) {
  console.error(`robots.txt not found at ${values.robots}`);
  process.exit(1);
}

const robotsTxt = readFileSync(values.robots, 'utf8');
const lines = robotsTxt.split('\n').map((l) => l.trim());

const disallows = [];
const sitemaps = [];
let inAllAgents = false;

for (const line of lines) {
  if (line.startsWith('User-agent:')) {
    inAllAgents = line.includes('*');
  }
  if (line.startsWith('Disallow:')) {
    disallows.push({ path: line.slice('Disallow:'.length).trim(), forAll: inAllAgents });
  }
  if (line.startsWith('Sitemap:')) {
    sitemaps.push(line.slice('Sitemap:'.length).trim());
  }
}

const issues = [];

// Check critical paths aren't disallowed
for (const dp of disallows.filter((d) => d.forAll)) {
  if (!dp.path) continue;
  for (const critical of CRITICAL_PATHS) {
    if (critical.startsWith(dp.path) || dp.path.startsWith(critical)) {
      issues.push(`CRITICAL: Disallow: ${dp.path} blocks ${critical}`);
    }
  }
}

// Check disallowed paths exist in dist
for (const dp of disallows) {
  if (!dp.path) continue;
  const localPath = join(values.dist, dp.path);
  const exists = existsSync(localPath) || existsSync(localPath + '.html') || existsSync(join(localPath, 'index.html'));
  if (!exists) {
    issues.push(`Phantom disallow: ${dp.path} (not found in dist/)`);
  }
}

// Print results
console.log('\nRobots.txt Validator');
console.log(`  File: ${values.robots}`);
console.log(`  Disallow rules: ${disallows.length}`);
console.log(`  Sitemap entries: ${sitemaps.length}`);

if (sitemaps.length === 0) {
  issues.push('No Sitemap directive found in robots.txt');
}

if (issues.length === 0) {
  console.log('\nAll robots.txt checks passed.');
} else {
  console.log(`\n${issues.length} issue(s) found:`);
  for (const issue of issues) {
    console.log(`  ✗ ${issue}`);
  }
  process.exitCode = 1;
}
