'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { Plus, X, Upload, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { uploadImage } from '@/lib/upload';
import MarkdownEditor from '@/components/ui/MarkdownEditor';
import { Product, ProductVariant } from '@/types';

interface ProductFormProps {
  initialData?: Product & { variants?: ProductVariant[] };
  onSubmit: (data: any, variants: any[]) => Promise<any>;
}

export default function ProductForm({ initialData, onSubmit }: ProductFormProps) {
  const router = useRouter();
  const { getToken } = useAuth();
  const { user } = useUser();

  // 1. Form States
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [price, setPrice] = useState(initialData?.price ? String(initialData.price) : '');
  const [comparePrice, setComparePrice] = useState(initialData?.compare_price ? String(initialData.compare_price) : '');
  const [category, setCategory] = useState<string>(() => {
    if (!initialData?.category) return 'Wood Carvings';
    if (typeof initialData.category === 'object') {
      return initialData.category.name || 'Wood Carvings';
    }
    return String(initialData.category);
  });
  const [stock, setStock] = useState(initialData?.stock ? String(initialData.stock) : '10');
  
  // Resolve initial images
  const initialImages = initialData?.images 
    ? initialData.images 
    : (initialData as any)?.image_url 
      ? [(initialData as any).image_url] 
      : [];
  const [images, setImages] = useState<string[]>(initialImages);

  // 2. Uploading State
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 3. Variants States
  const [variants, setVariants] = useState<Omit<ProductVariant, 'id' | 'product_id' | 'created_at'>[]>(
    initialData?.variants?.map(v => ({
      name: v.name,
      value: v.value,
      price_modifier: v.price_modifier,
      stock: v.stock,
    })) || []
  );

  const [newVarName, setNewVarName] = useState('Size'); // Size or Color
  const [newVarValue, setNewVarValue] = useState('');
  const [newVarPriceMod, setNewVarPriceMod] = useState('0');
  const [newVarStock, setNewVarStock] = useState('10');

  // Math variables
  const basePriceNum = Number(price) || 0;
  const comparePriceNum = Number(comparePrice) || 0;
  const discountPercent = comparePriceNum > basePriceNum
    ? Math.round(((comparePriceNum - basePriceNum) / comparePriceNum) * 100)
    : null;

  // Categories must match names seeded in migration 013 (categories table)
  const categories = [
    'Rugs & Tapestries',
    'Wood Carvings',
    'Oils & Cosmetics',
    'Excursions & Guided Tours',
    'Surf & Water Sports Lessons',
    'Culinary Arts & Cooking Classes',
  ];

  // Handle Multi-file Uploads
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return;
    
    setUploading(true);
    setError(null);

    try {
      const filesArray = Array.from(e.target.files);
      const uploadedUrls: string[] = [];

      for (const file of filesArray) {
        const url = await uploadImage(file, 'product-images', user.id, getToken);
        uploadedUrls.push(url);
      }

      setImages(prev => [...prev, ...uploadedUrls]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to upload images. Please check bucket rules.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // Variants Generator Handlers
  const addVariant = () => {
    if (!newVarValue.trim()) return;

    setVariants(prev => [
      ...prev,
      {
        name: newVarName,
        value: newVarValue.trim(),
        price_modifier: Number(newVarPriceMod) || 0,
        stock: Number(newVarStock) || 0,
      }
    ]);

    setNewVarValue('');
    setNewVarPriceMod('0');
    setNewVarStock('10');
  };

  const removeVariant = (index: number) => {
    setVariants(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Product title is required');
    if (!price || Number(price) <= 0) return setError('Please enter a valid price');
    if (images.length === 0) return setError('Please upload at least one cover image');

    setLoading(true);
    setError(null);

    const productPayload = {
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      compare_price: comparePrice ? Number(comparePrice) : null,
      category,
      stock: Number(stock) || 0,
      images,
      image_url: images[0], // fallback compatibility for legacy DB columns
    };

    try {
      await onSubmit(productPayload, variants);
      router.push('/dashboard/products');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during submission.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8" >
      
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-xs font-bold text-red-700">
          <AlertCircle className="h-4.5 w-4.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side Inputs Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card: Basic Details */}
          <div className="rounded-2xl glass-premium-white border-[rgba(232,227,216,0.45)] p-6 shadow-sm">
            <h3 className="text-base font-bold text-[#18181B] mb-4" >
              Product Identity
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#71717A] uppercase tracking-wider mb-1.5">
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Thuya Wood Jewelry Box"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-[rgba(232,227,216,0.8)] bg-white px-4 py-2.5 text-sm text-[#18181B] focus:border-[#18181B] focus:outline-none focus:ring-1 focus:ring-[#18181B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#71717A] uppercase tracking-wider mb-1.5">
                  Product Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-[rgba(232,227,216,0.8)] bg-white px-4 py-2.5 text-sm text-[#18181B] focus:border-[#18181B] focus:outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#71717A] uppercase tracking-wider mb-1.5">
                  Description & Story (Markdown Safe)
                </label>
                <MarkdownEditor value={description} onChange={setDescription} />
              </div>
            </div>
          </div>

          {/* Card: Media Assets */}
          <div className="rounded-2xl glass-premium-white border-[rgba(232,227,216,0.45)] p-6 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-bold text-[#18181B]" >
                Visual Assets Upload
              </h3>
              <span className="text-[10px] text-[#71717A] font-semibold">{images.length} images uploaded</span>
            </div>

            {/* Thumbnail upload box */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              
              {/* Previews */}
              {images.map((url, idx) => (
                <div key={url} className="group relative rounded-xl border border-[rgba(232,227,216,0.45)] bg-[#F5F0E8] h-28 overflow-hidden shadow-sm">
                  <img src={url} alt="product asset" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1.5 right-1.5 h-6 w-6 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-600 text-white shadow-sm transition-transform cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  {idx === 0 && (
                    <span className="absolute bottom-1.5 left-1.5 rounded bg-gray-900/90 text-[7.5px] font-extrabold tracking-widest uppercase text-white px-1.5 py-0.5">
                      Cover
                    </span>
                  )}
                </div>
              ))}

              {/* Upload Selector Block */}
              <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[rgba(232,227,216,0.8)] bg-[#F5F0E8] hover:bg-[#E8E3D8] cursor-pointer h-28 transition-colors">
                {uploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-[#18181B]" />
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-[#71717A]" />
                    <span className="text-[10px] font-extrabold text-[#71717A] uppercase tracking-widest mt-1">Upload</span>
                  </>
                )}
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Right Side Inputs Column (Pricing, Stock, Custom options) */}
        <div className="space-y-6">
          
          {/* Card: Pricing Details */}
          <div className="rounded-2xl glass-premium-white border-[rgba(232,227,216,0.45)] p-6 shadow-sm">
            <h3 className="text-base font-bold text-[#18181B] mb-4" >
              Pricing & Inventory
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#71717A] uppercase tracking-wider mb-1.5">
                  Sale Price (DH) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full rounded-xl border border-[rgba(232,227,216,0.8)] bg-white px-4 py-2.5 text-sm text-[#18181B] focus:border-[#18181B] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#71717A] uppercase tracking-wider mb-1.5">
                  Compare At Price (DH)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="0.00"
                    value={comparePrice}
                    onChange={(e) => setComparePrice(e.target.value)}
                    className="w-full rounded-xl border border-[rgba(232,227,216,0.8)] bg-white px-4 py-2.5 text-sm text-[#18181B] focus:border-[#18181B] focus:outline-none"
                  />
                  {discountPercent && (
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-[#10B981]/15 text-[#10B981] font-bold text-[9px] px-2 py-0.5 rounded-lg">
                      {discountPercent}% Off
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#71717A] uppercase tracking-wider mb-1.5">
                  Inventory Stock Count
                </label>
                <input
                  type="number"
                  placeholder="10"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full rounded-xl border border-[rgba(232,227,216,0.8)] bg-white px-4 py-2.5 text-sm text-[#18181B] focus:border-[#18181B] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Card: Custom Options Generator */}
          <div className="rounded-2xl glass-premium-white border-[rgba(232,227,216,0.45)] p-6 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-bold text-[#18181B]" >
                Options & Variants
              </h3>
              <span className="text-[10px] text-[#71717A] font-semibold">{variants.length} options configured</span>
            </div>

            {/* Configured options items display list */}
            {variants.length > 0 && (
              <div className="space-y-2 mb-4">
                {variants.map((v, index) => (
                  <div key={index} className="flex justify-between items-center bg-[#F5F0E8] rounded-xl px-3 py-2 border border-[rgba(232,227,216,0.45)] text-xs">
                    <div className="flex flex-col">
                      <span className="font-bold text-[#18181B]">{v.name}: {v.value}</span>
                      <span className="text-[10px] text-[#71717A]">
                        {(v.price_modifier ?? 0) > 0 ? `+${v.price_modifier} DH` : (v.price_modifier ?? 0) < 0 ? `${v.price_modifier} DH` : 'No surcharge'} • Stock: {v.stock}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="p-1 rounded bg-white text-[#71717A] hover:text-red-500 border border-[rgba(232,227,216,0.45)] cursor-pointer shadow-sm"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Quick generator subform fields */}
            <div className="bg-[#F5F0E8] rounded-xl p-3 border border-gray-150 space-y-3">
              <span className="flex items-center gap-1 text-[10px] font-bold text-[#18181B] uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5" /> Configure Option
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[8.5px] font-bold text-[#71717A] uppercase tracking-widest mb-1">Option Type</label>
                  <select
                    value={newVarName}
                    onChange={(e) => setNewVarName(e.target.value)}
                    className="w-full bg-white rounded-lg border border-[rgba(232,227,216,0.8)] text-xs py-1.5 px-2 text-[#18181B] focus:outline-none"
                  >
                    <option value="Size">Size</option>
                    <option value="Color">Color</option>
                    <option value="Material">Material</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[8.5px] font-bold text-[#71717A] uppercase tracking-widest mb-1">Option Value</label>
                  <input
                    type="text"
                    placeholder="e.g. Large or Blue"
                    value={newVarValue}
                    onChange={(e) => setNewVarValue(e.target.value)}
                    className="w-full bg-white rounded-lg border border-[rgba(232,227,216,0.8)] text-xs py-1.5 px-2 text-[#18181B] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[8.5px] font-bold text-[#71717A] uppercase tracking-widest mb-1">Surcharge (DH)</label>
                  <input
                    type="number"
                    value={newVarPriceMod}
                    onChange={(e) => setNewVarPriceMod(e.target.value)}
                    className="w-full bg-white rounded-lg border border-[rgba(232,227,216,0.8)] text-xs py-1.5 px-2 text-[#18181B] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[8.5px] font-bold text-[#71717A] uppercase tracking-widest mb-1">Surcharge Stock</label>
                  <input
                    type="number"
                    value={newVarStock}
                    onChange={(e) => setNewVarStock(e.target.value)}
                    className="w-full bg-white rounded-lg border border-[rgba(232,227,216,0.8)] text-xs py-1.5 px-2 text-[#18181B] focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={addVariant}
                className="w-full flex items-center justify-center gap-1 bg-white hover:bg-[#E8E3D8] border border-[rgba(232,227,216,0.8)] rounded-lg py-1.5 text-xs font-bold text-[#71717A] cursor-pointer shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" /> Add Option
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Button panel */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-[rgba(232,227,216,0.45)] select-none">
        <button
          type="button"
          onClick={() => router.push('/dashboard/products')}
          className="rounded-xl border border-[rgba(232,227,216,0.8)] px-6 py-2.5 text-xs font-bold text-[#71717A] hover:bg-[#F5F0E8] transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || uploading}
          className="flex items-center gap-2 rounded-xl bg-[#18181B] hover:bg-[#18181B] transition-all px-6 py-2.5 text-xs font-bold text-white shadow-md cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
              Saving Catalog...
            </>
          ) : (
            'Publish Catalog'
          )}
        </button>
      </div>

    </form>
  );
}
