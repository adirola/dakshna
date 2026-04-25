#!/usr/bin/env node
import { Command } from 'commander';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import matter from 'gray-matter';

const program = new Command();

program
  .option('--vendors <path>', 'Path to src/content/vendors/', './src/content/vendors')
  .option('--threshold <n>', 'Similarity threshold (0-1)', '0.85')
  .parse(process.argv);

const opts = program.opts();
const threshold = parseFloat(opts.threshold);

function similarity(a, b) {
  a = a.toLowerCase().replace(/[^a-z0-9]/g, '');
  b = b.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (a === b) return 1;
  const m = a.length;
  const n = b.length;
  if (m === 0 || n === 0) return 0;

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

function findDuplicates(vendors, thresh) {
  const pairs = [];
  for (let i = 0; i < vendors.length; i++) {
    for (let j = i + 1; j < vendors.length; j++) {
      const a = vendors[i];
      const b = vendors[j];
      if (a.data.category !== b.data.category && a.data.city.toLowerCase() !== b.data.city.toLowerCase()) continue;
      const nameSim = similarity(a.data.name, b.data.name);
      if (nameSim > thresh) {
        pairs.push({ vendor1: a.data.id, vendor2: b.data.id, nameScore: Math.round(nameSim * 100) / 100, filePath1: a.file, filePath2: b.file });
      }
    }
  }
  return pairs;
}

let files;
try {
  files = (await readdir(opts.vendors)).filter((f) => f.endsWith('.md') && f !== '.gitkeep');
} catch (err) {
  console.error(`Cannot read vendors directory: ${err.message}`);
  process.exit(1);
}

const vendors = await Promise.all(
  files.map(async (f) => {
    const raw = await readFile(join(opts.vendors, f), 'utf8');
    const { data } = matter(raw);
    return { data, file: join(opts.vendors, f) };
  })
);

console.log(`\nDuplicate Detector — ${vendors.length} vendors, threshold ${threshold}`);

if (vendors.length === 0) {
  console.log('No vendor files found.');
  process.exit(0);
}

const pairs = findDuplicates(vendors, threshold);

if (pairs.length === 0) {
  console.log('No probable duplicates found.');
} else {
  console.log(`\n${pairs.length} probable duplicate pair(s):\n`);
  console.log('| Score | Vendor 1 | Vendor 2 |');
  console.log('|-------|----------|----------|');
  for (const { vendor1, vendor2, nameScore } of pairs.sort((a, b) => b.nameScore - a.nameScore)) {
    console.log(`| ${nameScore.toFixed(2)} | ${vendor1} | ${vendor2} |`);
  }
  console.log('\nReview these manually before merging or deleting.');
}
