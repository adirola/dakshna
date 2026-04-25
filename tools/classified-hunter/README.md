# Classified Hunter

CLI tool for scraping Indian wedding vendor listings from multiple sources and importing them into the Dakshna content directory.

## Sources

| Source | Method | Notes |
|--------|--------|-------|
| `google` | Google Places Text Search API | Best quality; requires `GOOGLE_PLACES_API_KEY` |
| `justdial` | HTML scraping | Large dataset; anti-bot measures applied |
| `sulekha` | HTML scraping | Good regional coverage |
| `indiamart` | HTML scraping | B2B listings; useful for caterers/decorators |

## Usage

```bash
# Copy env vars first
cp .env.example .env
# edit .env with your GOOGLE_PLACES_API_KEY if using google source

# Scrape all sources for venues in Bangalore (limit 50 per source)
node tools/classified-hunter/index.mjs \
  --source all \
  --city bangalore \
  --category venue \
  --limit 50

# Scrape just JustDial for photographers in Mumbai
node tools/classified-hunter/index.mjs \
  --source justdial \
  --city mumbai \
  --category photographer

# Dry run (batch JSON only, no individual files)
node tools/classified-hunter/index.mjs \
  --source sulekha \
  --city delhi \
  --category caterer \
  --no-write
```

## Options

| Flag | Default | Description |
|------|---------|-------------|
| `--source` | `all` | `justdial`, `sulekha`, `indiamart`, `google`, or `all` |
| `--city` | required | City name (e.g. `bangalore`, `mumbai`) |
| `--category` | required | Schema category (see below) |
| `--limit` | `20` | Max results per source |
| `--output-dir` | `./src/content/vendors` | Where to write vendor JSON files |
| `--batch-dir` | `./data/hunts` | Where to save the batch JSON file |
| `--no-write` | `false` | Only save batch JSON, skip individual files |

## Categories

`venue`, `photographer`, `makeup`, `caterer`, `decorator`, `dj`, `pandit`, `planner`

## Anti-Bot Measures

- Rotates through 5 user-agent strings per request
- Configurable delay between requests (`SCRAPE_DELAY_MS`, default 2 s)
- ±20% jitter added to all delays
- Exponential backoff on 429/5xx responses (up to `SCRAPE_MAX_RETRIES` attempts)
- Checks `robots.txt` before scraping any path (skips disallowed paths)

## Output

Each run produces:
1. **Batch JSON** → `data/hunts/hunt-YYYY-MM-DD-{category}-{city}.json` (all results, including `_source` field)
2. **Individual JSON files** → `src/content/vendors/{slug}.json` (validated against schema; invalid entries are skipped with a warning)

Review the batch JSON before committing individual files. Use `tools/growth/duplicate-detector.mjs` to check for duplicates across existing content.
