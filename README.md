# dakshna

South Asian wedding vendor directory. Astro 5 + Cloudflare Pages + SSG.

## AI Agent Access (GitMCP)

This repo is accessible to AI agents via GitMCP:

```
MCP Server: https://gitmcp.io/adirola/dakshna
```

Add this URL to your MCP client config (Cursor, Claude Desktop, etc.) to give your AI assistant direct access to the codebase.

## Development

```bash
npm install
npm run dev       # localhost:4321
npm run build     # production build
npm run preview   # preview build locally
```

## Content

Vendor listings are in `src/content/vendors/` as Zod-validated Markdown files.
See [CONTRIBUTING.md](CONTRIBUTING.md) for the submission workflow (Task 17).

## Deployment

Cloudflare Pages. Push to `main` triggers CI (GitHub Actions → `.github/workflows/ci.yml`).
