# SEO Optimizer

360° SEO audit scripts for the Dakshna built site. Run these after `npm run build` to verify every page has correct meta tags, no broken links, and a valid `robots.txt`.

## Scripts

| Script | Purpose |
|--------|---------|
| `meta-audit.mjs` | Check every HTML page for title, description, OG tags, canonical, JSON-LD |
| `jsonld-gen.mjs` | Generate `LocalBusiness` JSON-LD snippets from vendor content |
| `link-checker.mjs` | Crawl internal links in `dist/`, report broken 404s |
| `robots-validator.mjs` | Validate `robots.txt` directives against actual routes |
| `seo-report.mjs` | Aggregate all checks into a Markdown report |

## Quick start

```bash
# Build first
npm run build

# Run full SEO report
node tools/seo-optimizer/seo-report.mjs --dist ./dist --output ./data/seo-report.md

# Individual checks
node tools/seo-optimizer/meta-audit.mjs --dist ./dist
node tools/seo-optimizer/link-checker.mjs --dist ./dist
node tools/seo-optimizer/robots-validator.mjs --dist ./dist --robots ./public/robots.txt

# Generate JSON-LD snippets for all vendors
node tools/seo-optimizer/jsonld-gen.mjs \
  --vendors ./src/content/vendors \
  --output ./data/jsonld
```

## Options

### `meta-audit.mjs`
| Flag | Default | Description |
|------|---------|-------------|
| `--dist` | `./dist` | Path to built site |
| `--format` | `text` | `text` or `json` |

### `link-checker.mjs`
| Flag | Default | Description |
|------|---------|-------------|
| `--dist` | `./dist` | Path to built site |
| `--format` | `text` | `text` or `json` |

### `robots-validator.mjs`
| Flag | Default | Description |
|------|---------|-------------|
| `--dist` | `./dist` | Path to built site |
| `--robots` | `./public/robots.txt` | Path to robots.txt |

### `seo-report.mjs`
| Flag | Default | Description |
|------|---------|-------------|
| `--dist` | `./dist` | Path to built site |
| `--format` | `markdown` | `markdown` or `json` |
| `--output` | (stdout) | Save report to file |

## Exit codes

All scripts exit with code `1` if issues are found (useful for CI). The `seo-report.mjs` exits with `1` if the overall score is below 80.
