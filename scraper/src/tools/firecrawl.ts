import FirecrawlApp from '@mendable/firecrawl-js';
import { config } from '../config.js';

export interface ScrapeResult {
  markdown: string;
  metadata: {
    title: string;
    description: string;
    sourceURL: string;
  };
}

let app: FirecrawlApp | null = null;

function getApp(): FirecrawlApp {
  if (!app) app = new FirecrawlApp({ apiKey: config.firecrawlApiKey });
  return app;
}

export async function firecrawlScrape(url: string): Promise<ScrapeResult> {
  const firecrawl = getApp();
  const result = await firecrawl.scrapeUrl(url, { formats: ['markdown'] });

  if (!result.success) {
    throw new Error(`Firecrawl scrape failed for ${url}: ${result.error}`);
  }

  return {
    markdown: result.markdown ?? '',
    metadata: {
      title: result.metadata?.title ?? '',
      description: result.metadata?.description ?? '',
      sourceURL: result.metadata?.sourceURL ?? url,
    },
  };
}
