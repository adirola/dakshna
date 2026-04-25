/**
 * Anti-bot helpers: user-agent rotation, configurable delays, robots.txt check.
 */

import { config } from '../../shared/config.mjs';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
];

let uaIndex = 0;

export function getRandomUserAgent() {
  const ua = USER_AGENTS[uaIndex % USER_AGENTS.length];
  uaIndex++;
  return ua;
}

export function defaultHeaders() {
  return {
    'User-Agent': getRandomUserAgent(),
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-IN,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache',
  };
}

/**
 * Wait for the configured scrape delay (with ±20% jitter).
 */
export async function delay(ms = config.scrapeDelayMs) {
  const jitter = ms * 0.2 * (Math.random() - 0.5);
  await new Promise((r) => setTimeout(r, Math.max(500, ms + jitter)));
}

/**
 * Fetch with retry logic and user-agent rotation.
 * @param {string} url
 * @param {RequestInit} [options]
 * @returns {Promise<Response>}
 */
export async function fetchWithRetry(url, options = {}) {
  let lastError;
  for (let attempt = 1; attempt <= config.scrapeMaxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        ...options,
        headers: { ...defaultHeaders(), ...(options.headers ?? {}) },
      });
      if (res.ok) return res;
      if (res.status === 429 || res.status >= 500) {
        const wait = attempt * config.scrapeDelayMs;
        console.warn(`  [anti-bot] HTTP ${res.status} on attempt ${attempt}/${config.scrapeMaxRetries}, waiting ${wait}ms`);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      return res;
    } catch (err) {
      lastError = err;
      console.warn(`  [anti-bot] fetch error attempt ${attempt}/${config.scrapeMaxRetries}: ${err.message}`);
      await new Promise((r) => setTimeout(r, attempt * 1000));
    }
  }
  throw lastError ?? new Error(`Failed to fetch ${url} after ${config.scrapeMaxRetries} attempts`);
}

/**
 * Check if the given path is allowed for our user-agent by robots.txt.
 * Returns true (allowed) if robots.txt can't be fetched or parsed.
 * @param {string} baseUrl - e.g. "https://www.justdial.com"
 * @param {string} path - e.g. "/bangalore/venues"
 */
export async function isAllowedByRobots(baseUrl, path) {
  try {
    const res = await fetch(`${baseUrl}/robots.txt`, {
      headers: { 'User-Agent': getRandomUserAgent() },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return true;
    const text = await res.text();
    return !isDisallowed(text, path);
  } catch {
    return true;
  }
}

function isDisallowed(robotsTxt, path) {
  const lines = robotsTxt.split('\n').map((l) => l.trim());
  let inRelevantBlock = false;

  for (const line of lines) {
    if (line.startsWith('User-agent:')) {
      const ua = line.slice('User-agent:'.length).trim();
      inRelevantBlock = ua === '*';
    }
    if (inRelevantBlock && line.startsWith('Disallow:')) {
      const disallowed = line.slice('Disallow:'.length).trim();
      if (disallowed && path.startsWith(disallowed)) return true;
    }
  }
  return false;
}
