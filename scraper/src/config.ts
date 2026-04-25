function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

export const config = {
  geminiApiKey: requireEnv('GEMINI_API_KEY'),
  firecrawlApiKey: requireEnv('FIRECRAWL_API_KEY'),
  geminiModel: 'gemini-2.5-flash',
  outputDir: process.env['OUTPUT_DIR'] ?? 'src/content/vendors',
};
