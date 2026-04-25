#!/usr/bin/env node
/**
 * duplicate-detector.mjs — Find probable duplicate vendors by name + city similarity.
 *
 * Usage:
 *   node tools/growth/duplicate-detector.mjs --vendors ./src/content/vendors
 *   node tools/growth/duplicate-detector.mjs --vendors ./src/content/vendors --threshold 0.8
 */

import { parseArgs } from 'node:util';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const { values } = parseArgs({
  options: {
    vendors:   { type: 'string', default: './src/content/vendors' },
    threshold: { type: 'string', default: '0.85' },
  },
  strict: false,
});

const threshold = parseFloat(values.threshold);

/** Levenshtein distance (normalized to 0-1 similarity) */
function similarity(a, b) {
  a = a.toLowerCase();
  b = b.toLowerCase();
  if (a === b) return 1;

  const m = a.length;
  const n = b.length;
  if (m === 0) return 0;
  if (n === 0) return 0;

  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return 1 - dp[m][n] / Math.max(m, n);
}

const files = readdirSync(values.vendors).filter((f) => f.endsWith('.json'));
const vendors = files.map((f) => JSON.parse(readFileSync(join(values.vendors, f), 'utf8')));

const duplicates = [];

for (let i = 0; i < vendors.length; i++) {
  for (let j = i + 1; j < vendors.length; j++) {
    const a = vendors[i];
    const b = vendors[j];

    // Only compare same category or same city
    if (a.category !== b.category && a.city.toLowerCase() !== b.city.toLowerCase()) continue;

    const nameSim = similarity(a.name, b.name);
    const citySim = similarity(a.city, b.city);
    const score = nameSim * 0.7 + citySim * 0.3;

    if (score >= threshold) {
      duplicates.push({ a: a.slug, b: b.slug, score: Math.round(score * 100) / 100 });
    }
  }
}

console.log(`\nDuplicate Detector — ${vendors.length} vendors, threshold ${threshold}`);

if (duplicates.length === 0) {
  console.log('No probable duplicates found.');
} else {
  console.log(`\n${duplicates.length} probable duplicate pair(s):\n`);
  for (const { a, b, score } of duplicates.sort((x, y) => y.score - x.score)) {
    console.log(`  ${score.toFixed(2)}  ${a}`);
    console.log(`         ${b}`);
  }
  console.log('\nReview these manually before merging or deleting.');
}
