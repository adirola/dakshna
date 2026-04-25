# Contributing to Dakshna

Dakshna is a curated directory of Indian wedding vendors. All listings are submitted via GitHub Pull Request and reviewed for quality before merging. This guide explains how to submit a new vendor listing.

---

## Prerequisites

- A GitHub account
- Basic familiarity with Git (fork, clone, commit, push, pull request)
- Knowledge of the vendor you are submitting (real business, live website)

---

## Submission Steps

### 1. Fork and Clone

Fork the repository on GitHub, then clone your fork:

```bash
git clone https://github.com/YOUR_USERNAME/dakshna.git
cd dakshna
```

### 2. Create a Branch

```bash
git checkout -b add/vendor-name-city
```

Use a descriptive branch name, e.g., `add/regal-gardens-bangalore`.

### 3. Copy the Template

```bash
cp src/content/vendors/_template.md src/content/vendors/your-vendor-slug.md
```

The slug (`your-vendor-slug`) must be unique, URL-safe, and descriptive. Use kebab-case, e.g., `regal-gardens-bangalore`.

### 4. Fill In the Frontmatter

Open the file and replace every placeholder value. Read the inline comments (`#`) carefully — they explain what each field expects. Remove all comment lines before submitting.

**Required fields** (cannot be left blank):

| Field | Description |
|---|---|
| `id` | Must match the filename slug (e.g., `regal-gardens-bangalore`) |
| `name` | Full business name |
| `url` | Live, reachable URL (HTTPS preferred) |
| `description` | 1–2 sentences, max 200 characters. See [Editorial Guidelines](#editorial-guidelines). |
| `category` | See [Categories](#categories) |
| `city` | Lowercase city name |
| `region` | See [Regions](#regions) |
| `pricing_range` | See [Pricing Ranges](#pricing-ranges) |
| `submitted_at` | Today's date in `YYYY-MM-DD` format |

**Optional fields** (safe to leave as empty defaults):

| Field | Default | Notes |
|---|---|---|
| `intents` | `[]` | Curated AI-navigation tags. See [Intent Tags](#intent-tags). |
| `related` | `[]` | Slugs of related listings already in the directory |
| `tags` | `[]` | Descriptive keywords for filtering |
| `featured` | `false` | Managed by Dakshna team. Do not set to `true`. |
| `verified` | `false` | Set by maintainers after review. Do not set to `true`. |

### 5. Write the Body

Below the closing `---` of the frontmatter, write 2–5 sentences of editorial body content. This appears on the vendor detail page. Follow the [Editorial Guidelines](#editorial-guidelines).

### 6. Validate Locally (Recommended)

If you have Node.js installed:

```bash
npm install
npm run build
```

A successful build means your listing passes the Zod schema validation. Fix any errors before submitting.

### 7. Commit and Push

```bash
git add src/content/vendors/your-vendor-slug.md
git commit -m "feat: add [Vendor Name] listing ([city])"
git push origin add/vendor-name-city
```

### 8. Open a Pull Request

Open a PR from your fork to the `main` branch of the Dakshna repository. Use the PR title format:

```
feat: add [Vendor Name] ([city], [category])
```

Example: `feat: add Regal Gardens (Bangalore, venue)`

Include in the PR description:
- Brief note on why this vendor is a good fit for the directory
- Confirmation that you have personally verified the URL is live
- Confirmation that the description is original (not copied from the vendor's website)

---

## Editorial Guidelines

Listings must meet these quality standards to be accepted. These guidelines follow Google HCU (Helpful Content Update) principles — content should be genuinely helpful, specific, and human-authored.

### What Makes a Good Description

- **Specific**: Mention the venue size, specialty style, location detail, or what makes this vendor unique
- **Honest**: Based on real knowledge of the business, not marketing copy
- **Concise**: Max 200 characters for the frontmatter `description` field; 2–5 sentences for the body
- **Useful**: Answers the question "is this vendor right for my wedding?"

**Good example:**
> Sprawling garden venue in Whitefield, Bangalore, ideal for South Indian ceremonies. Accommodates up to 500 guests with customizable mandap setups.

**Bad example (will be rejected):**
> The best wedding venue in Bangalore! Book now for unforgettable memories and amazing service at unbeatable prices.

### What Will Be Rejected

- Marketing language or superlatives ("best", "amazing", "unforgettable")
- Descriptions copied verbatim from the vendor's website
- Listings for non-existent or permanently closed businesses
- Spam or self-promotional listings without genuine editorial value
- Duplicate listings for a vendor already in the directory
- URLs that return 4xx/5xx errors

### Description Quality Bar

Ask yourself: "Would a friend trust this description to make a real wedding decision?" If yes, it passes. If it sounds like an ad, it fails.

---

## Field Reference

### Categories

| Value | Use for |
|---|---|
| `venue` | Wedding halls, gardens, hotels, banquet halls, resorts |
| `photographer` | Wedding photographers and videographers |
| `makeup` | Bridal makeup artists, hair stylists |
| `caterer` | Catering services, food vendors |
| `decorator` | Floral decorators, mandap designers, lighting vendors |
| `dj` | DJs, sound system providers, live bands |
| `pandit` | Priests, religious ceremony officiants |
| `planner` | Full-service wedding planners, coordinators |

### Regions

| Value | Covers |
|---|---|
| `south-india` | Karnataka, Tamil Nadu, Telangana, Andhra Pradesh, Kerala |
| `north-india` | Delhi, Uttar Pradesh, Punjab, Haryana, Rajasthan, Himachal Pradesh |
| `east-india` | West Bengal, Bihar, Odisha, Jharkhand, Assam, North-East states |
| `west-india` | Maharashtra, Gujarat, Goa |
| `international` | Outside India |

### Pricing Ranges

| Value | Approximate range (INR) | Notes |
|---|---|---|
| `budget` | Under ₹50,000 | Accessible vendors |
| `mid` | ₹50,000 – ₹2,00,000 | Most common range |
| `premium` | ₹2,00,000 – ₹10,00,000 | High-end services |
| `luxury` | Above ₹10,00,000 | Ultra-premium / destination weddings |

These are approximate guidance ranges, not hard limits. Use your best judgment.

### Intent Tags

Intent tags help AI agents navigate the directory. They are optional but encouraged. Use the following patterns:

| Pattern | Example |
|---|---|
| `find-{city}-{category}` | `find-bangalore-venue` |
| `find-{region}-{category}` | `find-south-india-photographer` |
| `plan-{style}-wedding` | `plan-south-indian-wedding` |
| `plan-wedding-in-{city}` | `plan-wedding-in-goa` |

Auto-generated intents (city+category, region+category, pricing+category) are created at build time from the frontmatter — you do not need to add those manually. Use the `intents` field only for specialized or curated intents.

---

## Featured Listings

Featured listings (`featured: true`) appear at the top of category and city pages, with a visual badge. Featured placement is a **paid tier** managed by the Dakshna editorial team.

To inquire about featured listing placement for a vendor you represent:

1. Submit the listing normally via PR (set `featured: false`)
2. Once merged, open a GitHub issue with the title: `[Featured] Vendor Name — featured listing inquiry`
3. The team will respond with pricing and next steps

Do not set `featured: true` in your submitted PR — it will be rejected.

---

## Maintainer Review Checklist

_For maintainers reviewing incoming PRs. All checkboxes must pass before merge._

### Automated Gates (CI must pass)

- [ ] Zod schema validation passes (`npm run build` succeeds)
- [ ] No TypeScript / build errors
- [ ] PR touches only `src/content/vendors/` files (one listing per PR preferred)

### URL Liveness

- [ ] Vendor `url` field returns HTTP 200 (or 301/302 to a live page)
- [ ] URL is the canonical business website (not a social media profile or aggregator)
- [ ] URL does not lead to a parked domain, "under construction" page, or 404

### Editorial Quality

- [ ] `description` is specific and original (not copied from the vendor's site)
- [ ] No marketing superlatives ("best", "amazing", "unforgettable")
- [ ] Body content (below frontmatter) is 2–5 sentences and genuinely informative
- [ ] Listing is for a real, operating business

### Field Accuracy

- [ ] `id` matches the file slug (filename without `.md`)
- [ ] `category` is the correct enum value for the business type
- [ ] `region` correctly maps to the vendor's `city`
- [ ] `pricing_range` is plausible for the vendor's market position
- [ ] `submitted_at` is a valid date in `YYYY-MM-DD` format
- [ ] `featured` is `false` and `verified` is `false`

### Spam / Abuse

- [ ] Not a duplicate of an existing listing
- [ ] Not a self-promotional spam submission without editorial merit
- [ ] PR author has not submitted more than 5 listings in 30 days without prior discussion

### Post-Merge

- [ ] Set `verified: true` in the merged file once URL liveness is confirmed by a maintainer
- [ ] If a featured listing agreement is in place, update `featured: true` after payment confirmation

---

## Questions?

Open a GitHub issue with the label `question` and the maintainers will respond.
