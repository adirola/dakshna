import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

const CATEGORY_ORDER = [
  'venue', 'photographer', 'makeup', 'caterer',
  'decorator', 'dj', 'pandit', 'planner',
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  venue: 'Venues',
  photographer: 'Photographers',
  makeup: 'Makeup Artists',
  caterer: 'Caterers',
  decorator: 'Decorators',
  dj: 'DJs',
  pandit: 'Pandits',
  planner: 'Planners',
};

export const GET: APIRoute = async () => {
  const site = import.meta.env.SITE as string;
  const allVendors = await getCollection('vendors');
  const byName = (a: { data: { name: string } }, b: { data: { name: string } }) =>
    a.data.name.localeCompare(b.data.name);

  const lines: string[] = [
    '# Dakshna',
    '',
    '> South Asian wedding vendor directory for India. Browse verified venues, photographers, caterers, and more.',
    '',
  ];

  if (allVendors.length > 0) {
    const featured = allVendors.filter((v) => v.data.featured).sort(byName);
    if (featured.length > 0) {
      lines.push('## Featured Vendors', '');
      for (const v of featured) {
        lines.push(`- [${v.data.name}](${site}/vendors/${v.data.slug}): ${v.data.description}`);
      }
      lines.push('');
    }

    for (const cat of CATEGORY_ORDER) {
      const entries = allVendors.filter((v) => v.data.category === cat).sort(byName);
      if (entries.length === 0) continue;
      lines.push(`## ${CATEGORY_LABELS[cat]}`, '');
      for (const v of entries) {
        lines.push(`- [${v.data.name}](${site}/vendors/${v.data.slug}): ${v.data.description}`);
      }
      lines.push('');
    }
  }

  lines.push(
    '## Developer Resources',
    '',
    '- [GitMCP Server](https://gitmcp.io/adirola/dakshna): Zero-config MCP endpoint. AI agents (Cursor, Claude, Copilot) can read repo files via this URL.',
    '- [GitHub](https://github.com/adirola/dakshna): Full source code',
    '- `src/content/vendors/`: Vendor `.json` listing files (Zod-validated)',
    '- `src/content.config.ts`: Content collection schema',
    '- `src/components/`: Astro UI components',
    '',
    '## Optional',
    '',
    `- [Full llms.txt](${site}/llms-full.txt): Extended version with all vendor listings and full descriptions`,
    '',
  );

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
