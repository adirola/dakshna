#!/usr/bin/env node
/**
 * category-mapper.mjs — Interactive CLI to map scraped categories to the 8-value schema enum.
 * Saves mapping rules to a JSON config for reuse by the normalizer.
 *
 * Usage:
 *   node tools/growth/category-mapper.mjs --input ./data/hunts/hunt-2026-04-25.json
 *   node tools/growth/category-mapper.mjs --rules ./data/category-rules.json --test "banquet hall"
 */

import { parseArgs } from 'node:util';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { CATEGORIES } from '../shared/schema.mjs';

const { values } = parseArgs({
  options: {
    input: { type: 'string', default: '' },
    rules: { type: 'string', default: './data/category-rules.json' },
    test:  { type: 'string', default: '' },
  },
  strict: false,
});

// Load existing rules
let rules = {};
if (existsSync(values.rules)) {
  rules = JSON.parse(readFileSync(values.rules, 'utf8'));
}

function applyRules(raw) {
  const lower = raw.toLowerCase().trim();
  if (rules[lower]) return rules[lower];
  for (const [pattern, cat] of Object.entries(rules)) {
    if (lower.includes(pattern)) return cat;
  }
  return null;
}

// Test mode: just check a single string
if (values.test) {
  const result = applyRules(values.test);
  console.log(`"${values.test}" → ${result ?? '(no match)'}`);
  process.exit(0);
}

if (!values.input) {
  console.error('Usage: node category-mapper.mjs --input <batch-file.json>');
  process.exit(1);
}

const batch = JSON.parse(readFileSync(values.input, 'utf8'));
const unknown = [...new Set(
  batch
    .map((v) => v._rawCategory ?? v.category)
    .filter((c) => c && !CATEGORIES.includes(c))
    .filter((c) => !applyRules(c))
)];

if (unknown.length === 0) {
  console.log('All categories are already mapped.');
  process.exit(0);
}

console.log(`\nCategory Mapper — ${unknown.length} unmapped categories`);
console.log(`Schema categories: ${CATEGORIES.join(', ')}\n`);

const rl = createInterface({ input: process.stdin, output: process.stdout });

function prompt(q) {
  return new Promise((resolve) => rl.question(q, resolve));
}

for (const raw of unknown) {
  const mapped = applyRules(raw);
  if (mapped) { console.log(`  "${raw}" → ${mapped} (already mapped)`); continue; }

  console.log(`\n  Raw category: "${raw}"`);
  const answer = await prompt(`  Map to (${CATEGORIES.join('/')}), or [s]kip: `);

  if (answer === 's' || answer === '') continue;
  if (CATEGORIES.includes(answer)) {
    rules[raw.toLowerCase()] = answer;
    console.log(`  Saved: "${raw}" → ${answer}`);
  } else {
    console.log(`  Invalid. Skipping.`);
  }
}

rl.close();
writeFileSync(values.rules, JSON.stringify(rules, null, 2) + '\n', 'utf8');
console.log(`\nRules saved → ${values.rules} (${Object.keys(rules).length} total rules)`);
