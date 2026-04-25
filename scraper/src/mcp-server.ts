import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { geminiWebSearch } from './tools/gemini-search.js';
import { firecrawlScrape } from './tools/firecrawl.js';
import { synthesizeVendors } from './synthesis/vendor-mapper.js';
import { formatVendorMarkdown, generateSlug } from './synthesis/formatter.js';
import { writeFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { config } from './config.js';

const server = new McpServer({
  name: 'dakshna-scraper',
  version: '0.1.0',
});

server.registerTool(
  'gemini_web_search',
  {
    description: 'Search the web via Gemini grounded search and return relevant URLs for wedding vendor directories.',
    inputSchema: z.object({
      query: z.string().describe('Search query targeting wedding vendor directory pages'),
    }),
  },
  async ({ query }) => {
    const results = await geminiWebSearch(query);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ results }, null, 2),
        },
      ],
    };
  }
);

server.registerTool(
  'firecrawl_scrape',
  {
    description: 'Scrape a wedding vendor directory page and return clean markdown content.',
    inputSchema: z.object({
      url: z.string().url().describe('URL of the vendor directory listing page to scrape'),
    }),
  },
  async ({ url }) => {
    const result = await firecrawlScrape(url);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

server.registerTool(
  'synthesize_vendor',
  {
    description: 'Synthesize scraped markdown content into Dakshna vendor .md files using Gemini. Writes files to src/content/vendors/ and returns the vendorMd content.',
    inputSchema: z.object({
      markdown: z.string().describe('Scraped markdown content from a vendor directory page'),
      sourceUrl: z.string().url().describe('Source URL of the scraped page'),
      category: z.string().optional().describe('Vendor category hint (venue, photographer, etc.)'),
      city: z.string().optional().describe('City hint for filtering and region inference'),
      outputDir: z.string().optional().describe('Override output directory (defaults to src/content/vendors)'),
    }),
  },
  async ({ markdown, sourceUrl, category, city, outputDir }) => {
    const vendors = await synthesizeVendors({ markdown, sourceUrl, category, city });
    const outDir = resolve(outputDir ?? config.outputDir);
    await mkdir(outDir, { recursive: true });

    const written: string[] = [];
    for (const vendor of vendors) {
      const slug = generateSlug(vendor);
      const md = formatVendorMarkdown(vendor);
      const filePath = join(outDir, `${slug}.md`);
      await writeFile(filePath, md, 'utf-8');
      written.push(filePath);
    }

    const vendorMd = vendors.map(formatVendorMarkdown).join('\n\n---\n\n');

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            {
              vendorMd,
              writtenFiles: written,
              count: vendors.length,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Dakshna scraper MCP server running on stdio');
}

main().catch((err) => {
  console.error('MCP server error:', err);
  process.exit(1);
});
