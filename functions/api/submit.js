import { Octokit } from 'octokit';

// Inline schema constants — CF Worker can't import from tools/shared/
const CATEGORIES = ['venue', 'photographer', 'makeup', 'caterer', 'decorator', 'dj', 'pandit', 'planner'];
const REGIONS = ['south-india', 'north-india', 'east-india', 'west-india', 'international'];
const PRICING_RANGES = ['budget', 'mid', 'premium', 'luxury'];

const ALLOWED_ORIGINS = ['https://dakshna.com', 'https://www.dakshna.com', 'http://localhost:4321'];
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const ipSubmissions = new Map();

function slugify(name, city) {
  return `${name} ${city}`.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/[\s-]+/g, '-');
}

function containsNewlines(str) {
  return typeof str === 'string' && /[\r\n]/.test(str);
}

function validate(body) {
  const errors = [];
  if (!body.name?.trim()) errors.push('name is required');
  else if (containsNewlines(body.name)) errors.push('name must not contain newlines');
  if (!body.url?.trim()) errors.push('url is required');
  else {
    try { new URL(body.url); } catch { errors.push('url is not a valid URL'); }
    if (containsNewlines(body.url)) errors.push('url must not contain newlines');
  }
  if (!body.description?.trim()) errors.push('description is required');
  else if (body.description.length > 200) errors.push('description must be ≤ 200 chars');
  else if (containsNewlines(body.description)) errors.push('description must not contain newlines');
  if (!CATEGORIES.includes(body.category)) errors.push(`category must be one of: ${CATEGORIES.join(', ')}`);
  if (!body.city?.trim()) errors.push('city is required');
  else if (containsNewlines(body.city)) errors.push('city must not contain newlines');
  if (!PRICING_RANGES.includes(body.pricing_range)) errors.push(`pricing_range must be one of: ${PRICING_RANGES.join(', ')}`);
  return errors;
}

function yamlQuote(value) {
  return JSON.stringify(String(value));
}

function generateMarkdown(vendor) {
  const yamlArray = (arr) =>
    Array.isArray(arr) && arr.length > 0
      ? '\n' + arr.map((v) => `  - ${v}`).join('\n')
      : ' []';

  const frontmatter = [
    '---',
    `id: ${yamlQuote(vendor.id)}`,
    `name: ${yamlQuote(vendor.name)}`,
    `url: ${yamlQuote(vendor.url)}`,
    `description: ${yamlQuote(vendor.description)}`,
    `category: ${vendor.category}`,
    `city: ${yamlQuote(vendor.city)}`,
    `region: ${vendor.region ?? 'south-india'}`,
    `intents:${yamlArray([])}`,
    `related:${yamlArray([])}`,
    `tags:${yamlArray([])}`,
    `pricing_range: ${vendor.pricing_range}`,
    `featured: false`,
    `verified: false`,
    `submitted_at: ${vendor.submitted_at}`,
    '---',
  ].join('\n');
  const body = `${vendor.name} is a ${vendor.category} vendor in ${vendor.city}.`;
  return frontmatter + '\n\n' + body + '\n';
}

function checkRateLimit(ip) {
  const now = Date.now();
  const record = ipSubmissions.get(ip);
  if (!record) {
    ipSubmissions.set(ip, { count: 1, windowStart: now });
    return true;
  }
  if (now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
    ipSubmissions.set(ip, { count: 1, windowStart: now });
    return true;
  }
  record.count++;
  return record.count <= RATE_LIMIT_MAX;
}

function getCorsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const corsHeaders = getCorsHeaders(request);

  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for') || 'unknown';
  if (!checkRateLimit(ip)) {
    return Response.json({ error: 'Too many submissions. Please try again later.' }, { status: 429, headers: corsHeaders });
  }

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: corsHeaders }); }

  const errors = validate(body);
  if (errors.length) return Response.json({ error: errors.join('; ') }, { status: 400, headers: corsHeaders });

  const vendor = {
    id: slugify(body.name, body.city),
    name: body.name.trim(),
    url: body.url.trim(),
    description: body.description.trim(),
    category: body.category,
    city: body.city.trim().toLowerCase(),
    pricing_range: body.pricing_range,
    featured: false,
    verified: false,
    submitted_at: new Date().toISOString().split('T')[0],
  };

  const token = env.GITHUB_TOKEN;
  if (!token) return Response.json({ error: 'Server configuration error' }, { status: 500, headers: corsHeaders });

  const octokit = new Octokit({ auth: token });
  const owner = env.GITHUB_OWNER || 'adirola';
  const repo = env.GITHUB_REPO || 'dakshna';

  try {
    const { data: ref } = await octokit.rest.git.getRef({ owner, repo, ref: 'heads/main' });
    const sha = ref.object.sha;

    const branchName = `vendor-submission/${vendor.id}-${Date.now()}`;
    await octokit.rest.git.createRef({ owner, repo, ref: `refs/heads/${branchName}`, sha });

    const filePath = `src/content/vendors/${vendor.id}.md`;
    const content = btoa(unescape(encodeURIComponent(generateMarkdown(vendor))));
    await octokit.rest.repos.createOrUpdateFileContents({
      owner, repo, path: filePath, branch: branchName,
      message: `Add vendor: ${vendor.name}`,
      content,
    });

    const { data: pr } = await octokit.rest.pulls.create({
      owner, repo,
      title: `Add vendor: ${vendor.name}`,
      head: branchName, base: 'main',
      body: `Submitted via /submit\n\n**Vendor**: ${vendor.name}\n**City**: ${vendor.city}\n**Category**: ${vendor.category}`,
    });

    return Response.json({ success: true, prUrl: pr.html_url }, { headers: corsHeaders });
  } catch (err) {
    console.error('GitHub API error:', err);
    return Response.json({ error: 'Failed to create submission. Please try again.' }, { status: 500, headers: corsHeaders });
  }
}

export async function onRequestOptions(context) {
  const corsHeaders = getCorsHeaders(context.request);
  return new Response(null, { status: 204, headers: corsHeaders });
}
