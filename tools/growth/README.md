# Growth Tools

Utility scripts for growing and maintaining the Dakshna vendor directory.

## Scripts

| Script | Purpose |
|--------|---------|
| `duplicate-detector.mjs` | Find probable duplicate vendor listings |
| `image-downloader.mjs` | Download and optimize vendor images to WebP |
| `category-mapper.mjs` | Interactive CLI to map scraped categories to schema enum |
| `bulk-import.mjs` | Import classified-hunter output into `src/content/vendors/` |
| `analytics-summary.mjs` | Generate weekly analytics report from Cloudflare Web Analytics |

## Usage

### duplicate-detector

```bash
node tools/growth/duplicate-detector.mjs --vendors ./src/content/vendors
# Adjust sensitivity (0.0–1.0, default 0.85):
node tools/growth/duplicate-detector.mjs --vendors ./src/content/vendors --threshold 0.75
```

### image-downloader

```bash
# First create a manifest: { "vendor-slug": ["https://...img1.jpg"] }
node tools/growth/image-downloader.mjs \
  --images ./data/vendor-images.json \
  --output ./public/vendors \
  --width 800 \
  --quality 80

# Requires sharp: npm install sharp
```

### category-mapper

```bash
# Interactive mapping session for a batch file
node tools/growth/category-mapper.mjs --input ./data/hunts/hunt-2026-04-25.json

# Test a string against saved rules
node tools/growth/category-mapper.mjs --rules ./data/category-rules.json --test "banquet hall"
```

### bulk-import

```bash
# Import and validate
node tools/growth/bulk-import.mjs \
  --input ./data/hunts/hunt-2026-04-25-venue-bangalore.json \
  --output ./src/content/vendors

# Dry run (validate only)
node tools/growth/bulk-import.mjs --input ./data/hunts/hunt.json --dry-run
```

### analytics-summary

```bash
CLOUDFLARE_API_TOKEN=xxx CLOUDFLARE_ACCOUNT_ID=yyy \
node tools/growth/analytics-summary.mjs \
  --days 7 \
  --output ./data/analytics-$(date +%Y-%m-%d).md
```
