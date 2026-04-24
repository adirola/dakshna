import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  const allVendors = await getCollection('vendors');

  const sorted = [...allVendors].sort((a, b) => {
    if (a.data.featured !== b.data.featured) return a.data.featured ? -1 : 1;
    return a.data.name.localeCompare(b.data.name);
  });

  const blocks: string[] = [];

  for (const v of sorted) {
    const { name, description, category, city, region, pricingRange, url, tags } = v.data;
    const metaLine = `- **Category**: ${category} | **City**: ${city}${region ? ` | **Region**: ${region}` : ''} | **Pricing**: ${pricingRange}`;
    const urlLine = url ? `- **URL**: ${url}` : null;

    const lines = [`## ${name}`, '', `> ${description}`, '', metaLine];
    if (urlLine) lines.push(urlLine);
    if (tags.length > 0) {
      lines.push(`- **Tags**: ${tags.join(', ')}`);
    }
    lines.push('', '---', '');
    blocks.push(lines.join('\n'));
  }

  return new Response(blocks.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
