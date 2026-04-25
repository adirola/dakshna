import { useState } from 'react';

const CATEGORIES = ['venue', 'photographer', 'makeup', 'caterer', 'decorator', 'dj', 'pandit', 'planner'] as const;
const PRICING_RANGES = ['budget', 'mid', 'premium', 'luxury'] as const;
const PRICING_LABELS: Record<string, string> = {
  budget: 'Budget (under ₹50,000)',
  mid: 'Mid-range (₹50,000 – ₹2,00,000)',
  premium: 'Premium (₹2,00,000 – ₹10,00,000)',
  luxury: 'Luxury (above ₹10,00,000)',
};

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

interface FormData {
  name: string;
  url: string;
  description: string;
  category: string;
  city: string;
  pricingRange: string;
}

const empty: FormData = { name: '', url: '', description: '', category: '', city: '', pricingRange: '' };

function validate(data: FormData): string[] {
  const errors: string[] = [];
  if (!data.name.trim()) errors.push('Business name is required');
  if (!data.url.trim()) errors.push('Website URL is required');
  else if (!/^https?:\/\//i.test(data.url)) errors.push('URL must start with http:// or https://');
  if (!data.description.trim()) errors.push('Description is required');
  else if (data.description.length > 500) errors.push('Description must be 500 characters or fewer');
  if (!data.category) errors.push('Category is required');
  if (!data.city.trim()) errors.push('City is required');
  if (!data.pricingRange) errors.push('Pricing range is required');
  return errors;
}

export default function PublicSubmitForm() {
  const [form, setForm] = useState<FormData>(empty);
  const [errors, setErrors] = useState<string[]>([]);
  const [state, setState] = useState<SubmitState>('idle');
  const [prUrl, setPrUrl] = useState<string>('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(form);
    if (errs.length > 0) { setErrors(errs); return; }
    setErrors([]);
    setState('submitting');

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json() as { prUrl?: string; error?: string };

      if (!res.ok) {
        setErrors([data.error ?? 'Submission failed. Please try again.']);
        setState('error');
        return;
      }

      setPrUrl(data.prUrl ?? '');
      setState('success');
    } catch {
      setErrors(['Network error. Please check your connection and try again.']);
      setState('error');
    }
  }

  if (state === 'success') {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-display font-semibold text-neutral-900 mb-2">Submission received!</h2>
        <p className="text-neutral-600 text-sm mb-4">
          Your listing has been submitted for review. Our team will review it and publish it within 2–3 business days.
        </p>
        {prUrl && (
          <a href={prUrl} target="_blank" rel="noopener noreferrer"
            className="text-sm text-primary-600 hover:text-primary-700 underline underline-offset-2">
            View submission on GitHub →
          </a>
        )}
        <button onClick={() => { setState('idle'); setForm(empty); }}
          className="mt-6 block mx-auto text-sm text-neutral-500 hover:text-neutral-700 underline underline-offset-2">
          Submit another listing
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      {errors.length > 0 && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm font-medium text-red-800 mb-2">Please fix the following:</p>
          <ul className="list-disc list-inside space-y-1">
            {errors.map((e) => <li key={e} className="text-sm text-red-700">{e}</li>)}
          </ul>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">Business name *</label>
        <input name="name" value={form.name} onChange={handleChange} disabled={state === 'submitting'}
          className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
          placeholder="e.g. Regal Gardens Bangalore" />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">Website URL *</label>
        <input name="url" type="url" value={form.url} onChange={handleChange} disabled={state === 'submitting'}
          className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
          placeholder="https://your-business.com" />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Short description * <span className="text-neutral-400 font-normal">({form.description.length}/500)</span>
        </label>
        <textarea name="description" value={form.description} onChange={handleChange} rows={3}
          disabled={state === 'submitting'}
          className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none disabled:opacity-50"
          placeholder="A short description of your business (1–2 sentences)." />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Category *</label>
          <select name="category" value={form.category} onChange={handleChange} disabled={state === 'submitting'}
            className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50">
            <option value="">Select…</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">City *</label>
          <input name="city" value={form.city} onChange={handleChange} disabled={state === 'submitting'}
            className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
            placeholder="e.g. bangalore" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">Pricing range *</label>
        <select name="pricingRange" value={form.pricingRange} onChange={handleChange} disabled={state === 'submitting'}
          className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50">
          <option value="">Select…</option>
          {PRICING_RANGES.map((p) => <option key={p} value={p}>{PRICING_LABELS[p]}</option>)}
        </select>
      </div>

      <button type="submit" disabled={state === 'submitting'}
        className="w-full bg-primary-600 text-white text-sm font-medium px-4 py-2.5 rounded-md hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed">
        {state === 'submitting' ? 'Submitting…' : 'Submit for review'}
      </button>

      <p className="text-xs text-neutral-500">
        Submissions are reviewed before publishing. By submitting, you confirm this is accurate information about your business.
        All listings are subject to our{' '}
        <a href="/contributing" className="underline underline-offset-2 hover:text-neutral-700">submission guidelines</a>.
      </p>
    </form>
  );
}
