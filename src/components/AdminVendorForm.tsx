import { useState } from 'react';

const CATEGORIES = ['venue', 'photographer', 'makeup', 'caterer', 'decorator', 'dj', 'pandit', 'planner'] as const;
const REGIONS = ['south-india', 'north-india', 'east-india', 'west-india', 'international'] as const;
const PRICING_RANGES = ['budget', 'mid', 'premium', 'luxury'] as const;
const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type Category = typeof CATEGORIES[number];
type Region = typeof REGIONS[number];
type PricingRange = typeof PRICING_RANGES[number];

interface VendorFormData {
  id: string;
  name: string;
  url: string;
  description: string;
  category: Category | '';
  city: string;
  region: Region | '';
  pricing_range: PricingRange | '';
  featured: boolean;
  verified: boolean;
  submitted_at: string;
  intents: string;
  related: string;
  tags: string;
}

const empty: VendorFormData = {
  id: '', name: '', url: '', description: '', category: '', city: '', region: '',
  pricing_range: '', featured: false, verified: false,
  submitted_at: new Date().toISOString().split('T')[0],
  intents: '', related: '', tags: '',
};

function slugify(name: string, city: string): string {
  return `${name} ${city}`.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/[\s-]+/g, '-');
}

function validate(data: VendorFormData): string[] {
  const errors: string[] = [];
  if (!data.id || !ID_RE.test(data.id)) errors.push('ID must be kebab-case (e.g. regal-gardens-bangalore)');
  if (!data.name.trim()) errors.push('Name is required');
  if (!data.url.trim()) errors.push('URL is required');
  else if (!/^https?:\/\//i.test(data.url)) errors.push('URL must start with http:// or https://');
  if (!data.description.trim()) errors.push('Description is required');
  else if (data.description.length > 200) errors.push('Description must be ≤ 200 characters');
  if (!data.category) errors.push('Category is required');
  if (!data.city.trim()) errors.push('City is required');
  if (!data.region) errors.push('Region is required');
  if (!data.pricing_range) errors.push('Pricing range is required');
  return errors;
}

function yamlArray(csv: string): string {
  const items = csv.split(',').map((s) => s.trim()).filter(Boolean);
  if (items.length === 0) return ' []';
  return '\n' + items.map((v) => `  - ${v}`).join('\n');
}

function generateMarkdown(data: VendorFormData): string {
  const frontmatter = [
    '---',
    `id: ${data.id}`,
    `name: ${data.name}`,
    `url: ${data.url}`,
    `description: ${data.description}`,
    `category: ${data.category}`,
    `city: ${data.city.toLowerCase()}`,
    `region: ${data.region}`,
    `intents:${yamlArray(data.intents)}`,
    `related:${yamlArray(data.related)}`,
    `tags:${yamlArray(data.tags)}`,
    `pricing_range: ${data.pricing_range}`,
    `featured: ${data.featured}`,
    `verified: ${data.verified}`,
    `submitted_at: ${data.submitted_at}`,
    '---',
  ].join('\n');
  const body = `${data.name} is a ${data.category} vendor in ${data.city}.`;
  return frontmatter + '\n\n' + body + '\n';
}

export default function AdminVendorForm() {
  const [form, setForm] = useState<VendorFormData>(empty);
  const [errors, setErrors] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    setForm((prev) => {
      const next = { ...prev, [name]: type === 'checkbox' ? checked : value };
      if (name === 'name' || name === 'city') {
        next.id = slugify(next.name, next.city);
      }
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(form);
    if (errs.length > 0) { setErrors(errs); return; }
    setErrors([]);
    const md = generateMarkdown(form);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${form.id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleCopy() {
    const errs = validate(form);
    if (errs.length > 0) { setErrors(errs); return; }
    setErrors([]);
    await navigator.clipboard.writeText(generateMarkdown(form));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const preview = form.name || form.id ? generateMarkdown(form) : null;

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

        {/* Basic Info */}
        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-2">Basic Info</legend>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Name *</label>
              <input name="name" value={form.name} onChange={handleChange}
                className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Regal Gardens Bangalore" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">ID (auto-generated)</label>
              <input name="id" value={form.id} onChange={handleChange}
                className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="regal-gardens-bangalore" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Website URL *</label>
            <input name="url" type="url" value={form.url} onChange={handleChange}
              className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="https://example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Description * <span className="text-neutral-400 font-normal">({form.description.length}/200)</span>
            </label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3}
              className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              placeholder="1–2 sentence editorial summary of this vendor." />
          </div>
        </fieldset>

        {/* Classification */}
        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-2">Classification</legend>
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
              <select name="pricing_range" value={form.pricing_range} onChange={handleChange}
                className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">Select…</option>
                {PRICING_RANGES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">City *</label>
              <input name="city" value={form.city} onChange={handleChange}
                className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="bangalore" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Region *</label>
              <select name="region" value={form.region} onChange={handleChange}
                className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">Select…</option>
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
        </fieldset>

        {/* Settings */}
        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-2">Settings</legend>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Submitted At</label>
            <input name="submitted_at" type="date" value={form.submitted_at} onChange={handleChange}
              className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
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
        </fieldset>

        {/* Metadata */}
        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-2">Metadata</legend>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Intents <span className="text-neutral-400 font-normal">(comma-separated)</span></label>
            <input name="intents" value={form.intents} onChange={handleChange}
              className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="find-bangalore-venues, plan-south-indian-wedding" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Related IDs <span className="text-neutral-400 font-normal">(comma-separated)</span></label>
            <input name="related" value={form.related} onChange={handleChange}
              className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="spice-caterers, bloom-mandap" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Tags <span className="text-neutral-400 font-normal">(comma-separated)</span></label>
            <input name="tags" value={form.tags} onChange={handleChange}
              className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="garden, outdoor, large-capacity" />
          </div>
        </fieldset>

        <div className="flex gap-3 pt-2">
          <button type="submit"
            className="flex-1 bg-primary-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
            Download .md
          </button>
          <button type="button" onClick={handleCopy}
            className="flex-1 border border-primary-600 text-primary-600 text-sm font-medium px-4 py-2 rounded-md hover:bg-primary-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
            {copied ? 'Copied!' : 'Copy Markdown'}
          </button>
        </div>
      </form>

      <div>
        <p className="text-sm font-medium text-neutral-700 mb-2">Preview</p>
        <pre className="bg-neutral-950 text-green-400 text-xs rounded-lg p-4 overflow-auto h-[32rem] font-mono leading-relaxed whitespace-pre-wrap">
          {preview ?? <span className="text-neutral-500">Fill in the form to see a preview…</span>}
        </pre>
        <p className="mt-3 text-xs text-neutral-500">
          Place the downloaded file in <code className="bg-neutral-100 px-1 rounded">src/content/vendors/</code>, then commit and push.
        </p>
      </div>
    </div>
  );
}
