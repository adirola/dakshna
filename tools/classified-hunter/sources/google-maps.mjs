/**
 * Google Maps source — uses Google Places Text Search API.
 * Requires GOOGLE_PLACES_API_KEY in environment.
 */

import { requireConfig, config } from '../../shared/config.mjs';
import { normalizeVendor, deduplicateVendors } from '../lib/normalizer.mjs';
import { delay } from '../lib/anti-bot.mjs';

const PLACES_API = 'https://maps.googleapis.com/maps/api/place';

/**
 * Search Google Places for wedding vendors.
 * @param {object} opts
 * @param {string} opts.city
 * @param {string} opts.category - schema category value
 * @param {number} [opts.limit=20]
 * @returns {Promise<object[]>} normalized vendors
 */
export async function scrapeGoogleMaps({ city, category, limit = 20 }) {
  requireConfig('googlePlacesApiKey');

  const query = `wedding ${category} ${city} India`;
  const results = [];
  let pageToken = null;

  do {
    const url = new URL(`${PLACES_API}/textsearch/json`);
    url.searchParams.set('query', query);
    url.searchParams.set('key', config.googlePlacesApiKey);
    url.searchParams.set('region', 'in');
    if (pageToken) url.searchParams.set('pagetoken', pageToken);

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Places API error: ${res.status} ${res.statusText}`);

    const data = await res.json();
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Places API returned status: ${data.status} — ${data.error_message ?? ''}`);
    }

    for (const place of data.results ?? []) {
      const vendor = normalizeVendor(
        {
          name: place.name,
          city,
          category,
          description: place.formatted_address ?? '',
          url: undefined,
          tags: place.types ?? [],
        },
        'google-maps',
      );
      if (vendor) results.push(vendor);
      if (results.length >= limit) break;
    }

    pageToken = results.length < limit ? (data.next_page_token ?? null) : null;
    if (pageToken) await delay(2500); // Google requires a short wait before using page token
  } while (pageToken && results.length < limit);

  return deduplicateVendors(results.slice(0, limit));
}

export { scrapeGoogleMaps as scrape };
