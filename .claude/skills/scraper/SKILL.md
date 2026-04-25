# Scraper Skill

Scrape wedding vendor directory pages and synthesize Dakshna-compatible vendor Markdown files using the MCP server.

## MCP Server

Loaded via `.mcp.json` as `dakshna-scraper` (stdio subprocess):

```
node --experimental-strip-types scraper/src/mcp-server.ts
```

Requires env vars: `GEMINI_API_KEY`, `FIRECRAWL_API_KEY`

## Exposed Tools

| Tool | Description |
|---|---|
| `gemini_web_search` | Gemini 2.5 Flash grounded search → directory listing URLs |
| `firecrawl_scrape` | Scrape a URL → clean markdown content |
| `synthesize_vendor` | Synthesize scraped markdown → validated `.md` vendor files |

## Exposed Prompts

| Prompt | Trigger |
|---|---|
| `scraper_workflow` | Full pipeline: search → scrape → synthesize for a given category + city |

## Trigger Phrases

Use this skill when the user says any of:
- "scrape vendors", "find vendors", "discover vendors"
- "populate vendors", "seed vendors", "add vendors"
- "scrape wedding vendors in [city]", "find [category] vendors"
- "run the scraper", "run the scraper agent"

## Orchestration Instructions

The `scraper_workflow` prompt sequences the 3 tools in order. Use it as the entry point for end-to-end scraping runs:

```
<category> vendors in <city>
→ GET prompt: scraper_workflow(category, city, limit?)
→ Follow the prompt instructions step by step
→ Tools are called in sequence by the LLM following the prompt
```

**Do not** call tools out of order. The pipeline is:
1. `gemini_web_search` — find directory listing URLs
2. `firecrawl_scrape` — scrape each URL for markdown content
3. `synthesize_vendor` — synthesize and write `.md` files to `src/content/vendors/`

## Output

Vendor files are written to `src/content/vendors/<name>-<city>.md` with YAML frontmatter matching the Astro content collection schema defined in `src/content.config.ts`.

## CLI Alternative

For non-LLM use, run the CLI directly:

```bash
node --experimental-strip-types scraper/src/index.ts --category photographer --city mumbai
node --experimental-strip-types scraper/src/index.ts --query "wedding decorator listings Delhi"
```
