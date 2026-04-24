---
# VENDOR LISTING TEMPLATE
# Copy this file to src/content/vendors/your-vendor-slug.md
# Replace all placeholder values with real information.
# Lines starting with # are YAML comments — remove them before submitting.

id: _template                          # Unique slug. Must match the filename (without .md). Use kebab-case. E.g.: "regal-gardens-bangalore"
name: Vendor Name Here                 # Full display name of the business
url: https://example.com               # Live, canonical URL. Must return HTTP 200. HTTPS preferred.
description: >                         # 1–2 sentence editorial summary. Max 200 characters. No marketing fluff.
  A genuine, specific description of what this vendor offers and who it serves.
category: venue                        # One of: venue | photographer | makeup | caterer | decorator | dj | pandit | planner
city: bangalore                        # City name in lowercase. E.g.: bangalore, delhi, mumbai, chennai, hyderabad
region: south-india                    # One of: south-india | north-india | east-india | west-india | international
intents:                               # Optional. Curated intent tags. Leave as [] if unsure.
  - find-bangalore-venues              # Pattern: find-{city}-{category} or plan-{style}-wedding
related: []                            # Optional. Slugs of related listings already in the directory.
tags:                                  # Optional. Descriptive keywords for filtering.
  - outdoor                            # Examples: outdoor, garden, indoor, traditional, modern, budget-friendly
pricing_range: mid                     # One of: budget | mid | premium | luxury
featured: false                        # Do not set to true — managed by the Dakshna team after payment confirmation.
verified: false                        # Set by maintainers after URL + editorial review. Leave false on submission.
submitted_at: 2026-01-01               # Date you are submitting this PR. Format: YYYY-MM-DD
---

Write a longer editorial body here (2–5 sentences). Describe the vendor in detail — venue capacity,
specialties, what makes them stand out for Indian weddings. This section appears on the vendor detail page.
No marketing language. Write as if recommending to a friend.
