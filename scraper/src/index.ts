import { parseArgs } from 'node:util';
import { writeFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { geminiWebSearch } from './tools/gemini-search.js';
import { firecrawlScrape } from './tools/firecrawl.js';
import { synthesizeVendors } from './synthesis/vendor-mapper.js';
import { formatVendorMarkdown, generateSlug } from './synthesis/formatter.js';
import { config } from './config.js';

const { values } = parseArgs({
  options: {
    category: { type: 'string', short: 'c' },
    city: { type: 'string', short: 'l' },
    query: { type: 'string', short: 'q' },
    limit: { type: 'string', default: '3' },
    'output-dir': { type: 'string', short: 'o' },
  },
  strict: true,
});

async function run() {
  const category = values['category'];
  const city = values['city'];
  const outputDir = resolve(values['output-dir'] ?? config.outputDir);
  const limit = parseInt(values['limit'] ?? '3', 10);

  if (!category && !city && !values['query']) {
    console.error('Usage: node src/index.ts --category <category> --city <city>');
    console.error('       node src/index.ts --query <query>');
    process.exit(1);
  }

  const searchQuery =
    values['query'] ??
    `${category ?? ''} vendor listings ${city ?? ''} wedding directory site:wedmegood.com OR site:weddingbazaar.com`.trim();

  console.log(`\nSearching: ${searchQuery}`);
  const searchResults = await geminiWebSearch(searchQuery);
  console.log(`Found ${searchResults.length} URLs`);

  if (searchResults.length === 0) {
    console.log('No URLs found. Try a different query.');
    return;
  }

  await mkdir(outputDir, { recursive: true });

  let totalWritten = 0;
  const urls = searchResults.slice(0, limit);

  for (const result of urls) {
    console.log(`\nScraping: ${result.uri}`);
    try {
      const scraped = await firecrawlScrape(result.uri);
      console.log(`  Scraped ${scraped.markdown.length} chars`);

      const vendors = await synthesizeVendors({
        markdown: scraped.markdown,
        sourceUrl: result.uri,
        category,
        city,
      });
      console.log(`  Synthesized ${vendors.length} vendors`);

      for (const vendor of vendors) {
        const slug = generateSlug(vendor);
        const md = formatVendorMarkdown(vendor);
        const filePath = join(outputDir, `${slug}.md`);
        await writeFile(filePath, md, 'utf-8');
        console.log(`  Written: ${filePath}`);
        totalWritten++;
      }
    } catch (err) {
      console.error(`  Error processing ${result.uri}:`, err instanceof Error ? err.message : err);
    }
  }

  console.log(`\nDone. ${totalWritten} vendor files written to ${outputDir}`);
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
