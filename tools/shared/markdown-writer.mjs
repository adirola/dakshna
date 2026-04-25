import { mkdir, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Render a vendor object as a YAML frontmatter string (between --- markers).
 * Array fields are rendered as YAML sequences.
 * @param {object} vendor
 * @returns {string}
 */
export function generateFrontmatter(vendor) {
  const date =
    vendor.submitted_at instanceof Date
      ? vendor.submitted_at.toISOString().split('T')[0]
      : String(vendor.submitted_at ?? new Date().toISOString().split('T')[0]);

  const yamlArray = (arr) =>
    Array.isArray(arr) && arr.length > 0
      ? '\n' + arr.map((v) => `  - ${v}`).join('\n')
      : ' []';

  return [
    '---',
    `id: ${vendor.id}`,
    `name: ${vendor.name}`,
    `url: ${vendor.url}`,
    `description: ${vendor.description}`,
    `category: ${vendor.category}`,
    `city: ${vendor.city}`,
    `region: ${vendor.region}`,
    `intents:${yamlArray(vendor.intents ?? [])}`,
    `related:${yamlArray(vendor.related ?? [])}`,
    `tags:${yamlArray(vendor.tags ?? [])}`,
    `pricing_range: ${vendor.pricing_range}`,
    `featured: ${vendor.featured ?? false}`,
    `verified: ${vendor.verified ?? false}`,
    `submitted_at: ${date}`,
    '---',
  ].join('\n');
}

/**
 * Generate a minimal markdown body for a vendor.
 * @param {object} vendor
 * @returns {string}
 */
export function generateBody(vendor) {
  return `${vendor.name} is a ${vendor.category} vendor in ${vendor.city}.`;
}

/**
 * Write a vendor as a markdown file to outputDir/{vendor.id}.md.
 * Creates outputDir recursively if it doesn't exist.
 * @param {object} vendor
 * @param {string} outputDir
 * @returns {Promise<{ filePath: string }>}
 */
export async function writeVendorMarkdown(vendor, outputDir) {
  await mkdir(outputDir, { recursive: true });
  const filePath = join(outputDir, `${vendor.id}.md`);
  const content = generateFrontmatter(vendor) + '\n\n' + generateBody(vendor) + '\n';
  await writeFile(filePath, content, 'utf8');
  return { filePath };
}

/**
 * Check if a file exists without throwing.
 * @param {string} filePath
 * @returns {Promise<boolean>}
 */
export async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}
