import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import type { Vendor } from '../../content.config';
import { CATEGORY_LABELS, PRICING_LABELS } from '../../lib/vendors';

export const getStaticPaths: GetStaticPaths = async () => {
  const vendors = await getCollection('vendors');
  return vendors.map((entry) => ({
    params: { slug: entry.data.slug },
    props: { vendor: entry.data },
  }));
};

function toMarkdown(vendor: Vendor): string {
  const fm: string[] = [
    '---',
    `slug: ${vendor.slug}`,
    `name: "${vendor.name}"`,
    `category: ${vendor.category}`,
    `city: "${vendor.city}"`,
  ];
  if (vendor.region) fm.push(`region: ${vendor.region}`);
  fm.push(`pricingRange: ${vendor.pricingRange}`);
  if (vendor.url) fm.push(`url: ${vendor.url}`);
  fm.push(`tags: [${vendor.tags.map((t) => `"${t}"`).join(', ')}]`);
  fm.push(`related: [${vendor.related.map((r) => `"${r}"`).join(', ')}]`);
  if (vendor.featured !== undefined) fm.push(`featured: ${vendor.featured}`);
  if (vendor.verified !== undefined) fm.push(`verified: ${vendor.verified}`);
  fm.push('---');

  const body: string[] = [
    `# ${vendor.name}`,
    '',
    `**Category:** ${CATEGORY_LABELS[vendor.category] ?? vendor.category}`,
    `**City:** ${vendor.city}${vendor.region ? `, ${vendor.region.replace(/-/g, ' ')}` : ''}`,
    `**Pricing:** ${PRICING_LABELS[vendor.pricingRange]}`,
    '',
    vendor.description,
  ];

  if (vendor.tags.length > 0) {
    body.push('', `**Tags:** ${vendor.tags.join(', ')}`);
  }
  if (vendor.url) {
    body.push('', `**Website:** ${vendor.url}`);
  }
  if (vendor.related.length > 0) {
    body.push(
      '',
      `**Related Vendors:** ${vendor.related.map((r) => `[${r}](/vendors/${r})`).join(', ')}`,
    );
  }

  return fm.join('\n') + '\n\n' + body.join('\n') + '\n';
}

export const GET: APIRoute<{ vendor: Vendor }> = ({ props }) => {
  return new Response(toMarkdown(props.vendor), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
