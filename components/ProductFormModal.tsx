'use client';

import { useState, useEffect } from 'react';
import { Product } from '../types';
import { X, Tag, Info, ShieldAlert } from 'lucide-react';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null; // If editing
  onSubmit: (data: any) => Promise<{ error?: string; data?: any }>;
}

const PRODUCT_CATEGORIES = [
  'Vase & Ceramic',
  'Organic Oil & Soap',
  'Handwoven Rug',
  'Authentic Spice Blend',
  'Handcrafted Leather Bag',
  'Thuya Woodbox',
  'Handmade Blanket',
  'Silver Jewellery',
];

export default function ProductFormModal({ isOpen, onClose, product, onSubmit }: ProductFormModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [imageUrl, setImageUrl] = useState('');
  const [stock, setStock] = useState<number>(5);
  const [category, setCategory] = useState(PRODUCT_CATEGORIES[0]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync edits if a product object is provided
  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description || '');
      setPrice(product.price ?? 0);
      setImageUrl(product.images?.[0] || (product as any).image_url || '');
      setStock(product.stock ?? 0);
      setCategory(
        typeof product.category === 'object' && product.category
          ? product.category.name
          : typeof product.category === 'string'
            ? product.category
            : PRODUCT_CATEGORIES[0]
      );
    } else {
      setName('');
      setDescription('');
      setPrice(0);
      setImageUrl('');
      setStock(5);
      setCategory(PRODUCT_CATEGORIES[0]);
    }
    setErrorMsg(null);
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setErrorMsg('Product name is required! الرجاء كتابة اسم المنتج');
      return;
    }
    if (price <= 0) {
      setErrorMsg('Price must be greater than zero. السعر غير مقبول');
      return;
    }
    if (stock < 0) {
      setErrorMsg('Stock cannot be negative. المخزون غير صحيح');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const res = await onSubmit({
      name,
      description,
      price,
      image_url: imageUrl,
      images: [imageUrl],
      stock,
      category,
      slug: name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'),
      compare_price: null,
      tags: [],
      sku: null,
      weight: null,
      dimensions: null,
    });

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      onClose(); // Close modal on success
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Glass backdrop overlay */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-[#18181B]/40 backdrop-blur-md transition-opacity duration-300"
      />

      {/* Modal Dialog Content card */}
      <div className="relative w-full max-w-lg transform overflow-hidden rounded-3xl border glass-premium-white border-[rgba(232,227,216,0.45)] p-6 shadow-xl transition-all duration-300 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(232,227,216,0.8)] bg-[#FAF9F6] text-[#71717A] hover:text-[#18181B]"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#CA8A04]/10 text-[#CA8A04]">
            <Tag className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-[#18181B]">
              {product ? 'Edit Product Catalog' : 'Add New Product Listing'}
            </h3>
            <p className="text-[10px] font-bold text-[#CA8A04] uppercase tracking-wider">
              {product ? 'تعديل بيانات المنتج' : 'أضف منتجًا جديدًا لمتجرك'}
            </p>
          </div>
        </div>

        {/* Validation Errors */}
        {errorMsg && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-semibold text-red-700 flex gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Inputs Fields */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          
          {/* Product Name */}
          <div>
            <label className="block text-xs font-bold text-[#18181B]">
              Product Title * (اسم المنتج)
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Pure Cold Pressed Argan Oil"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[rgba(232,227,216,0.8)] bg-[#F5F0E8] px-3.5 py-2.5 text-xs text-[#18181B] placeholder-[#71717A] transition-all focus:border-[#CA8A04] focus:bg-white focus:outline-none"
            />
          </div>

          {/* Grid of Price & Stock & Category */}
          <div className="grid grid-cols-2 gap-3.5">
            {/* Price tag */}
            <div>
              <label className="block text-xs font-bold text-[#18181B]">
                Price (MAD) * (السعر بالدرهم)
              </label>
              <input
                type="number"
                required
                min="0.1"
                step="0.01"
                placeholder="250.00"
                value={price || ''}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                className="mt-1 w-full rounded-xl border border-[rgba(232,227,216,0.8)] bg-[#F5F0E8] px-3.5 py-2.5 text-xs text-[#18181B] transition-all focus:border-[#CA8A04] focus:bg-white focus:outline-none"
              />
            </div>

            {/* Inventory stock */}
            <div>
              <label className="block text-xs font-bold text-[#18181B]">
                Inventory Stock (الكمية المتوفرة)
              </label>
              <input
                type="number"
                required
                min="0"
                placeholder="10"
                value={stock}
                onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                className="mt-1 w-full rounded-xl border border-[rgba(232,227,216,0.8)] bg-[#F5F0E8] px-3.5 py-2.5 text-xs text-[#18181B] transition-all focus:border-[#CA8A04] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Product Category dropdown */}
          <div>
            <label className="block text-xs font-bold text-[#18181B]">
              Product Category (تصنيف المنتج)
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[rgba(232,227,216,0.8)] bg-[#F5F0E8] px-3.5 py-2.5 text-xs text-[#18181B] focus:border-[#CA8A04] focus:bg-white focus:outline-none"
            >
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Product Image URL */}
          <div>
            <label className="block text-xs font-bold text-[#18181B]">
              Product Image URL (رابط صورة المنتج)
            </label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/photo-..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[rgba(232,227,216,0.8)] bg-[#F5F0E8] px-3.5 py-2.5 text-xs text-[#18181B] placeholder-[#71717A] transition-all focus:border-[#CA8A04] focus:bg-white focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-[#18181B]">
              Product Description (تفاصيل المنتج)
            </label>
            <textarea
              rows={3}
              placeholder="Provide information on raw materials, artisan labor, extraction methods..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[rgba(232,227,216,0.8)] bg-[#F5F0E8] px-3.5 py-2.5 text-xs text-[#18181B] placeholder-[#71717A] transition-all focus:border-[#CA8A04] focus:bg-white focus:outline-none"
            />
          </div>

          {/* Form Actions Footer buttons */}
          <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-[#F5F0E8] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border glass-premium-white border-[rgba(232,227,216,0.45)] px-4 py-2.5 text-xs font-bold text-[#71717A] hover:text-[#18181B]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-gradient-to-tr from-[#CA8A04] to-[#EAA17C] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:opacity-95 disabled:opacity-50"
            >
              {submitting ? 'Saving... جاري الحفظ' : product ? 'Save Changes' : 'List Product'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
