'use client';

import { useState } from 'react';
import { Store } from 'lucide-react';

interface StoreFormProps {
  onSubmit: (data: { name: string; description: string; logo_url: string; category: string }) => Promise<{ error?: string; data?: any }>;
}

const CATEGORIES = [
  'Argan & Cosmetics',
  'Carpets & Rugs',
  'Handcrafted Pottery',
  'Spices & Herbs',
  'Leather & Bags',
  'Traditional Clothing',
  'Wood & Thuya Crafts',
];

export default function StoreForm({ onSubmit }: StoreFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Store name is required! الرجاء كتابة اسم المتجر');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const res = await onSubmit({
      name,
      description,
      logo_url: logoUrl,
      category,
    });

    if (res.error) {
      setErrorMsg(res.error);
    }
    setSubmitting(false);
  };

  return (
    <div className="mx-auto max-w-2xl rounded-3xl border glass-premium-white border-[rgba(232,227,216,0.45)] p-8 shadow-sm">
      
      {/* Form Title & Context */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#CA8A04]/10 text-[#CA8A04]">
          <Store className="h-6 w-6" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold text-[#18181B] sm:text-2xl">
            Register Your Artisan Store
          </h2>
          <p className="text-xs text-[#71717A] tracking-wide uppercase mt-0.5 font-semibold">
            سجل متجرك الحرفي للبيع المباشر
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-[#71717A]">
        Create a gorgeous digital storefront to showcase your handcrafted Essaouira products. Connect with thousands of visitors looking for authentic local items!
      </p>

      {/* Error alert messages */}
      {errorMsg && (
        <div className="mt-5 rounded-2xl bg-red-50 border border-red-200 p-4 text-xs font-semibold text-red-700">
          {errorMsg}
        </div>
      )}

      {/* Core Form Fields */}
      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        
        {/* Store Name Input */}
        <div>
          <label className="block text-sm font-bold text-[#18181B]">
            Store Name <span className="text-red-500">*</span> (اسم المتجر)
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Traditional Mogador Loom"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-[rgba(232,227,216,0.8)] bg-[#F5F0E8] px-4 py-3 text-sm text-[#18181B] placeholder-[#71717A] transition-all focus:border-[#CA8A04] focus:bg-white focus:outline-none"
          />
        </div>

        {/* Category Selector */}
        <div>
          <label className="block text-sm font-bold text-[#18181B]">
            Artisanal Category (فئة المتجر)
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-[rgba(232,227,216,0.8)] bg-[#F5F0E8] px-4 py-3 text-sm text-[#18181B] focus:border-[#CA8A04] focus:bg-white focus:outline-none"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Logo URL Input */}
        <div>
          <label className="block text-sm font-bold text-[#18181B]">
            Logo Image URL (رابط شعار المتجر)
          </label>
          <input
            type="url"
            placeholder="https://images.unsplash.com/photo-... (optional)"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-[rgba(232,227,216,0.8)] bg-[#F5F0E8] px-4 py-3 text-sm text-[#18181B] placeholder-[#71717A] transition-all focus:border-[#CA8A04] focus:bg-white focus:outline-none"
          />
        </div>

        {/* Store Description input */}
        <div>
          <label className="block text-sm font-bold text-[#18181B]">
            Store Description (وصف المتجر)
          </label>
          <textarea
            rows={4}
            placeholder="Tell buyers about your artisanal techniques, materials, and local heritage..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-[rgba(232,227,216,0.8)] bg-[#F5F0E8] px-4 py-3 text-sm text-[#18181B] placeholder-[#71717A] transition-all focus:border-[#CA8A04] focus:bg-white focus:outline-none"
          />
        </div>

        {/* Form Action Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-gradient-to-tr from-[#CA8A04] to-[#EAA17C] py-3.5 text-sm font-bold text-white shadow-md transition-all hover:opacity-95 focus:outline-none disabled:opacity-50"
          >
            {submitting ? 'Creating store... جاري التسجيل' : 'Create Store & Start Selling'}
          </button>
        </div>

      </form>
    </div>
  );
}
