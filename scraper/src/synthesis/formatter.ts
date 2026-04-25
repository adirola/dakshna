import type { Vendor } from './vendor-mapper.js';

function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function generateSlug(vendor: Vendor): string {
  return `${toKebabCase(vendor.name)}-${toKebabCase(vendor.city)}`;
}

function yamlValue(value: unknown): string {
  if (typeof value === 'string') {
    const needsQuotes = /[:#\[\]{},|>&*!'"?@`]/.test(value) || value.includes('\n');
    return needsQuotes ? `"${value.replace(/"/g, '\\"')}"` : value;
  }
  if (typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    return `\n${(value as string[]).map((v) => `  - ${yamlValue(v)}`).join('\n')}`;
  }
  return String(value);
}

export function formatVendorMarkdown(vendor: Vendor): string {
  const frontmatter = [
    '---',
    `id: ${yamlValue(vendor.id)}`,
    `name: ${yamlValue(vendor.name)}`,
    `url: ${yamlValue(vendor.url)}`,
    `description: ${yamlValue(vendor.description)}`,
    `category: ${vendor.category}`,
    `city: ${yamlValue(vendor.city)}`,
    `region: ${vendor.region}`,
    `intents: ${yamlValue(vendor.intents ?? [])}`,
    `related: ${yamlValue(vendor.related)}`,
    `tags: ${yamlValue(vendor.tags)}`,
    `pricing_range: ${vendor.pricing_range}`,
    `featured: ${vendor.featured}`,
    `verified: ${vendor.verified}`,
    `submitted_at: ${vendor.submitted_at}`,
    '---',
  ].join('\n');

  const body = `\n# ${vendor.name}\n\n${vendor.description}\n`;

  return frontmatter + body;
}
