import { useState } from 'react';

const CATEGORIES = ['venue', 'photographer', 'makeup', 'caterer', 'decorator', 'dj', 'pandit', 'planner'] as const;
const PRICING_RANGES = ['budget', 'mid', 'premium', 'luxury'] as const;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type Category = typeof CATEGORIES[number];
type PricingRange = typeof PRICING_RANGES[number];

interface VendorFormData {
  slug: string;
  name: string;
  category: Category | '';
  city: string;
  region: string;
  description: string;
  pricingRange: PricingRange | '';
  url: string;
  tags: string;
  related: string;
  featured: boolean;
  verified: boolean;
}

const empty: VendorFormData = {
  slug: '', name: '', category: '', city: '', region: '', description: '',
  pricingRange: '', url: '', tags: '', related: '', featured: false, verified: false,
};

function toSlug(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/[\s-]+/g, '-');
}

function validate(data: VendorFormData): string[] {
  const errors: string[] = [];
  if (!data.slug || !SLUG_RE.test(data.slug)) errors.push('Slug must be kebab-case (e.g. regal-gardens-bangalore)');
  if (!data.name.trim()) errors.push('Name is required');
  if (data.name.length > 120) errors.push('Name must be ≤ 120 characters');
  if (!data.category) errors.push('Category is required');
  if (!data.city.trim()) errors.push('City is required');
  if (!data.description.trim()) errors.push('Description is required');
  if (data.description.length > 500) errors.push('Description must be ≤ 500 characters');
  if (!data.pricingRange) errors.push('Pricing range is required');
  if (data.url && !/^https?:\/\//i.test(data.url)) errors.push('URL must start with http:// or https://');
  return errors;
}

function buildVendorJson(data: VendorFormData): object {
  const vendor: Record<string, unknown> = {
    slug: data.slug,
    name: data.name.trim(),
    category: data.category,
    city: data.city.trim().toLowerCase(),
    description: data.description.trim(),
    pricingRange: data.pricingRange,
    tags: data.tags.split(',').map((t) => t.trim()).filter(Boolean),
    related: data.related.split(',').map((t) => t.trim()).filter(Boolean),
    featured: data.featured,
    verified: data.verified,
  };
  if (data.region.trim()) vendor.region = data.region.trim();
  if (data.url.trim()) vendor.url = data.url.trim();
  return vendor;
}

export default function AdminVendorForm() {
  const [form, setForm] = useState<VendorFormData>(empty);
  const [errors, setErrors] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (name === 'name' && !form.slug) {
      setForm((prev) => ({ ...prev, name: value, slug: toSlug(value) }));
    }
  }

  function handleCityChange(e: React.ChangeEvent<HTMLInputElement>) {
    const city = e.target.value;
    setForm((prev) => ({
      ...prev, city,
      slug: toSlug(`${prev.name} ${city}`),
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(form);
    if (errs.length > 0) { setErrors(errs); return; }
    setErrors([]);
    const json = JSON.stringify(buildVendorJson(form), null, 2);
    const blob = new Blob([json + '\n'], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${form.slug}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleCopy() {
    const errs = validate(form);
    if (errs.length > 0) { setErrors(errs); return; }
    setErrors([]);
    const json = JSON.stringify(buildVendorJson(form), null, 2);
    await navigator.clipboard.writeText(json + '\n');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const jsonPreview = form.name || form.slug
    ? JSON.stringify(buildVendorJson(form), null, 2)
    : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <form onSubmit={handleSubmit} className="space-y-5">
        {errors.length > 0 && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</p>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((e) => <li key={e} className="text-sm text-red-700">{e}</li>)}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Name *</label>
            <input name="name" value={form.name} onChange={handleChange}
              className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Regal Gardens Bangalore" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Slug *</label>
            <input name="slug" value={form.slug} onChange={handleChange}
              className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="regal-gardens-bangalore" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Category *</label>
            <select name="category" value={form.category} onChange={handleChange}
              className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Select…</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Pricing Range *</label>
            <select name="pricingRange" value={form.pricingRange} onChange={handleChange}
              className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Select…</option>
              {PRICING_RANGES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">City *</label>
            <input name="city" value={form.city} onChange={handleCityChange}
              className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="bangalore" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Region</label>
            <input name="region" value={form.region} onChange={handleChange}
              className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="karnataka" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Description * <span className="text-neutral-400 font-normal">({form.description.length}/500)</span>
          </label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={3}
            className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            placeholder="1–2 sentence editorial summary of this vendor." />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Website URL</label>
          <input name="url" type="url" value={form.url} onChange={handleChange}
            className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="https://example.com" />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Tags <span className="text-neutral-400 font-normal">(comma-separated)</span></label>
          <input name="tags" value={form.tags} onChange={handleChange}
            className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="garden, outdoor, large-capacity" />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Related vendor slugs <span className="text-neutral-400 font-normal">(comma-separated)</span></label>
          <input name="related" value={form.related} onChange={handleChange}
            className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="spice-caterers, bloom-mandap" />
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="featured" checked={form.featured} onChange={handleChange}
              className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500" />
            <span className="text-sm font-medium text-neutral-700">Featured</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="verified" checked={form.verified} onChange={handleChange}
              className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500" />
            <span className="text-sm font-medium text-neutral-700">Verified</span>
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit"
            className="flex-1 bg-primary-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
            Download JSON
          </button>
          <button type="button" onClick={handleCopy}
            className="flex-1 border border-primary-600 text-primary-600 text-sm font-medium px-4 py-2 rounded-md hover:bg-primary-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
            {copied ? 'Copied!' : 'Copy JSON'}
          </button>
        </div>
      </form>

      <div>
        <p className="text-sm font-medium text-neutral-700 mb-2">Preview</p>
        <pre className="bg-neutral-950 text-green-400 text-xs rounded-lg p-4 overflow-auto h-96 font-mono leading-relaxed">
          {jsonPreview ?? <span className="text-neutral-500">Fill in the form to see a preview…</span>}
        </pre>
        <p className="mt-3 text-xs text-neutral-500">
          Place the downloaded file in <code className="bg-neutral-100 px-1 rounded">src/content/vendors/</code>, then commit and push.
        </p>
      </div>
    </div>
  );
}
