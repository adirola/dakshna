# YouTube Enrichment

Find YouTube channels and videos for Dakshna vendor listings, and save them for display on vendor detail pages.

## Usage

```bash
# With YouTube API (higher rate limits, reliable)
YOUTUBE_API_KEY=your-key node tools/youtube-enrichment/index.mjs \
  --vendors ./src/content/vendors \
  --output ./data/youtube.json

# Without API key (scraping fallback, slower, may break if YouTube changes)
node tools/youtube-enrichment/index.mjs \
  --vendors ./src/content/vendors \
  --output ./data/youtube.json
```

## Options

| Flag | Default | Description |
|------|---------|-------------|
| `--vendors` | `./src/content/vendors` | Path to vendor JSON files |
| `--output` | `./data/youtube.json` | Output JSON file path |
| `--limit` | `5` | Max videos per vendor |

## Output format

```json
{
  "regal-gardens-bangalore": {
    "channel": "https://www.youtube.com/channel/UC...",
    "videos": [
      { "url": "https://www.youtube.com/watch?v=...", "title": "Regal Gardens Wedding Highlights" }
    ],
    "subscriberCount": null
  }
}
```

## Getting a YouTube API key

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable the **YouTube Data API v3**
3. Create a credential (API key)
4. Add to `.env`: `YOUTUBE_API_KEY=your-key`

The free tier provides 10,000 units/day. Each search call costs 100 units.
For ~100 vendors, one enrichment run costs ~10,000 units (exactly at the free limit).
Run this sparingly or on-demand rather than in CI.
