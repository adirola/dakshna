/**
 * Shared configuration loader for CLI tools.
 * Reads environment variables with sensible defaults.
 * Load a .env file before calling this if needed (use --env-file flag in Node 20+).
 */

export const config = {
  // Scraping
  scrapeDelayMs: parseInt(process.env.SCRAPE_DELAY_MS ?? '2000', 10),
  scrapeMaxRetries: parseInt(process.env.SCRAPE_MAX_RETRIES ?? '3', 10),

  // Google Places API (Classified Hunter)
  googlePlacesApiKey: process.env.GOOGLE_PLACES_API_KEY ?? '',

  // YouTube Data API v3 (YouTube Enrichment)
  youtubeApiKey: process.env.YOUTUBE_API_KEY ?? '',

  // GitHub API (Public Submission form backend)
  githubToken: process.env.GITHUB_TOKEN ?? '',
  githubOwner: process.env.GITHUB_OWNER ?? 'adirola',
  githubRepo: process.env.GITHUB_REPO ?? 'dakshna',

  // Cloudflare Web Analytics (Growth Tools)
  cloudflareApiToken: process.env.CLOUDFLARE_API_TOKEN ?? '',
  cloudflareAccountId: process.env.CLOUDFLARE_ACCOUNT_ID ?? '',
};

export function getScraperConfig() {
  return {
    delayMs: parseInt(process.env.SCRAPE_DELAY_MS ?? '2000', 10),
    maxRetries: parseInt(process.env.SCRAPE_MAX_RETRIES ?? '3', 10),
    googlePlacesApiKey: process.env.GOOGLE_PLACES_API_KEY ?? null,
  };
}

export function getGithubConfig() {
  if (!process.env.GITHUB_TOKEN) console.warn('[config] GITHUB_TOKEN is not set');
  return {
    token: process.env.GITHUB_TOKEN ?? '',
    owner: process.env.GITHUB_OWNER ?? 'adirola',
    repo: process.env.GITHUB_REPO ?? 'dakshna',
  };
}

export function getYoutubeConfig() {
  return { apiKey: process.env.YOUTUBE_API_KEY ?? null };
}

export function getCloudflareConfig() {
  return {
    apiToken: process.env.CLOUDFLARE_API_TOKEN ?? null,
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID ?? null,
  };
}

/**
 * Assert required env vars are present. Exits with error if any are missing.
 * @param {string[]} keys - keys from `config` that must be non-empty
 */
export function requireConfig(...keys) {
  const missing = keys.filter((k) => !config[k]);
  if (missing.length > 0) {
    const envNames = {
      googlePlacesApiKey: 'GOOGLE_PLACES_API_KEY',
      youtubeApiKey: 'YOUTUBE_API_KEY',
      githubToken: 'GITHUB_TOKEN',
      githubOwner: 'GITHUB_OWNER',
      githubRepo: 'GITHUB_REPO',
      cloudflareApiToken: 'CLOUDFLARE_API_TOKEN',
      cloudflareAccountId: 'CLOUDFLARE_ACCOUNT_ID',
    };
    const names = missing.map((k) => envNames[k] ?? k.toUpperCase());
    console.error(`Missing required env vars: ${names.join(', ')}`);
    console.error('Copy .env.example to .env and fill in the values.');
    process.exit(1);
  }
}
