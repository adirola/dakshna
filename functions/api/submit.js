/**
 * Cloudflare Pages Function: POST /api/submit
 *
 * Validates a vendor submission, creates a branch + .json file on GitHub,
 * and opens a pull request for maintainer review.
 *
 * Required environment variables (set in Cloudflare Pages → Settings → Environment):
 *   GITHUB_TOKEN   — PAT with repo scope
 *   GITHUB_OWNER   — repository owner (default: adirola)
 *   GITHUB_REPO    — repository name (default: dakshna)
 */

const CATEGORIES = ['venue', 'photographer', 'makeup', 'caterer', 'decorator', 'dj', 'pandit', 'planner'];
const PRICING_RANGES = ['budget', 'mid', 'premium', 'luxury'];

/** @param {Request} request @param {object} env */
export async function onRequestPost({ request, env }) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: corsHeaders });
  }

  // Validate
  const errors = validateSubmission(body);
  if (errors.length > 0) {
    return new Response(JSON.stringify({ error: errors.join('; ') }), { status: 422, headers: corsHeaders });
  }

  const token = env.GITHUB_TOKEN;
  const owner = env.GITHUB_OWNER ?? 'adirola';
  const repo = env.GITHUB_REPO ?? 'dakshna';

  if (!token) {
    return new Response(JSON.stringify({ error: 'Server configuration error' }), { status: 500, headers: corsHeaders });
  }

  try {
    const prUrl = await createVendorPR({ body, token, owner, repo });
    return new Response(JSON.stringify({ prUrl }), { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error('[submit] GitHub error:', err.message);
    return new Response(JSON.stringify({ error: 'Failed to create submission. Please try again.' }), {
      status: 500, headers: corsHeaders,
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// ── Validation ────────────────────────────────────────────────────────────────

function validateSubmission(body) {
  const errors = [];
  if (!body.name?.trim()) errors.push('name is required');
  if (!body.url?.trim()) errors.push('url is required');
  else {
    try { new URL(body.url); } catch { errors.push('url is not a valid URL'); }
  }
  if (!body.description?.trim()) errors.push('description is required');
  else if (body.description.length > 500) errors.push('description must be ≤ 500 chars');
  if (!CATEGORIES.includes(body.category)) errors.push(`category must be one of: ${CATEGORIES.join(', ')}`);
  if (!body.city?.trim()) errors.push('city is required');
  if (!PRICING_RANGES.includes(body.pricingRange)) errors.push(`pricingRange must be one of: ${PRICING_RANGES.join(', ')}`);
  return errors;
}

// ── GitHub PR creation ────────────────────────────────────────────────────────

function toSlug(str) {
  return str.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/[\s-]+/g, '-');
}

async function githubApi(path, { token, method = 'GET', body } = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      'User-Agent': 'dakshna-submit-function/1.0',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    throw new Error(`GitHub API ${method} ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

async function createVendorPR({ body, token, owner, repo }) {
  const slug = toSlug(`${body.name} ${body.city}`);
  const branch = `submit/${slug}-${Date.now()}`;
  const filePath = `src/content/vendors/${slug}.json`;

  const vendor = {
    slug,
    name: body.name.trim(),
    category: body.category,
    city: body.city.trim().toLowerCase(),
    description: body.description.trim(),
    pricingRange: body.pricingRange,
    url: body.url.trim(),
    tags: [],
    related: [],
    featured: false,
    verified: false,
  };

  const fileContent = btoa(JSON.stringify(vendor, null, 2) + '\n');

  // 1. Get default branch SHA
  const repoData = await githubApi(`/repos/${owner}/${repo}`, { token });
  const defaultBranch = repoData.default_branch ?? 'main';

  const refData = await githubApi(`/repos/${owner}/${repo}/git/ref/heads/${defaultBranch}`, { token });
  const baseSha = refData.object.sha;

  // 2. Create branch
  await githubApi(`/repos/${owner}/${repo}/git/refs`, {
    token, method: 'POST',
    body: { ref: `refs/heads/${branch}`, sha: baseSha },
  });

  // 3. Commit file
  await githubApi(`/repos/${owner}/${repo}/contents/${filePath}`, {
    token, method: 'PUT',
    body: {
      message: `feat: add vendor listing — ${body.name} (${body.city})`,
      content: fileContent,
      branch,
    },
  });

  // 4. Open PR
  const pr = await githubApi(`/repos/${owner}/${repo}/pulls`, {
    token, method: 'POST',
    body: {
      title: `feat: add vendor — ${body.name} (${body.category}, ${body.city})`,
      body: [
        '## New Vendor Submission',
        '',
        `- **Name**: ${body.name}`,
        `- **Category**: ${body.category}`,
        `- **City**: ${body.city}`,
        `- **Pricing**: ${body.pricingRange}`,
        `- **URL**: ${body.url}`,
        '',
        '### Description',
        body.description,
        '',
        '---',
        '_Submitted via dakshna.com/submit_',
      ].join('\n'),
      head: branch,
      base: defaultBranch,
    },
  });

  return pr.html_url;
}
