import { mkdir, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { writeVendorMarkdown } from '../../shared/markdown-writer.mjs';

/**
 * Write vendors to a JSON file.
 * @param {object[]} vendors
 * @param {string} outputPath
 */
export async function writeJson(vendors, outputPath) {
  const dir = outputPath.replace(/\/[^/]+$/, '');
  await mkdir(dir, { recursive: true });
  await writeFile(outputPath, JSON.stringify(vendors, null, 2) + '\n', 'utf8');
}

/**
 * Write vendor objects as .md files to outputDir.
 * Skips vendors where outputDir/{id}.md already exists.
 * @param {object[]} vendors
 * @param {string} outputDir
 * @returns {Promise<{ written: number, skipped: number }>}
 */
export async function writeMarkdownFiles(vendors, outputDir) {
  let written = 0;
  let skipped = 0;

  for (const vendor of vendors) {
    const targetPath = join(outputDir, `${vendor.id}.md`);
    try {
      await access(targetPath);
      console.warn(`  ~ ${vendor.id}.md already exists — skipping`);
      skipped++;
    } catch {
      await writeVendorMarkdown(vendor, outputDir);
      written++;
    }
  }

  return { written, skipped };
}
