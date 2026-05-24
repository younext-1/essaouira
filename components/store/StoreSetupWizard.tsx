'use client';

import { useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { Loader2, ArrowRight, ArrowLeft, Upload, Check, Store as StoreIcon, AlertCircle } from 'lucide-react';
import { uploadImage } from '@/lib/upload';

interface StoreSetupWizardProps {
  onComplete: (storeData: any) => Promise<any>;
}

export default function StoreSetupWizard({ onComplete }: StoreSetupWizardProps) {
  const { user } = useUser();
  const { getToken } = useAuth();
  
  // 1. Wizard Steps: 1, 2, 3
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 2. Form States
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('Artisanal Wood');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Essaouira Medina');
  
  // Storage assets
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const categories = [
    'Artisanal Wood',
    'Cosmetics & Oils',
    'Surf Gear',
    'Leather Goods',
    'Moroccan Rugs',
    'Pottery & Ceramic',
  ];

  const locations = [
    'Essaouira Medina',
    'Mogador Port',
    'Diabat Village',
    'Mogador Golf & Resort',
    'Sidi Kaouki Beach',
    'Industrial Zone',
  ];

  // Auto slug generator helper
  const handleNameChange = (val: string) => {
    setName(val);
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // remove special characters
      .replace(/[\s_]+/g, '-')  // replace spaces/underscores with dashes
      .replace(/^-+|-+$/g, ''); // trim leading/trailing dashes
    setSlug(generatedSlug);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return;
    setUploadingLogo(true);
    setError(null);
    try {
      const file = e.target.files[0];
      const url = await uploadImage(file, 'store-assets', user.id, getToken);
      setLogoUrl(url);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Logo upload failed. Verify bucket setup.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return;
    setUploadingBanner(true);
    setError(null);
    try {
      const file = e.target.files[0];
      const url = await uploadImage(file, 'store-assets', user.id, getToken);
      setBannerUrl(url);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Banner upload failed. Verify bucket setup.');
    } finally {
      setUploadingBanner(false);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!name.trim()) return setError('Shop name is required');
      if (!slug.trim()) return setError('Shop URL slug is required');
      setError(null);
      setStep(2);
    } else if (step === 2) {
      if (!description.trim()) return setError('Please write a brief store story');
      setError(null);
      setStep(3);
    }
  };

  const prevStep = () => {
    setError(null);
    setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    
    const payload = {
      name: name.trim(),
      slug: slug.trim(),
      category,
      description: description.trim(),
      location,
      logo_url: logoUrl || 'https://images.unsplash.com/photo-1546213290-e1b492ab3eee?w=300', // quality placeholder logo
      banner_url: bannerUrl || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200', // artisan interior banner
    };

    try {
      await onComplete(payload);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to initialize store.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-gray-100 bg-white p-8 shadow-xl" style={{ fontFamily: 'Outfit, sans-serif' }}>
      
      {/* Wizard Header Progress Bar */}
      <div className="mb-8 select-none">
        <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
          <span>Step {step} of 3</span>
          <span className="text-[#6366F1]">
            {step === 1 ? 'Shop Identity' : step === 2 ? 'Details & Visuals' : 'Launch Shop'}
          </span>
        </div>
        <div className="h-1.5 w-full bg-gray-150 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#6366F1] transition-all duration-300 ease-out"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-xs font-bold text-red-700 mb-6">
          <AlertCircle className="h-4.5 w-4.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Step Panels */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center max-w-md mx-auto mb-2 select-none">
            <h2 className="text-xl font-bold text-[#111827]" style={{ fontFamily: 'Syne, sans-serif' }}>
              Claim Your Workshop's Identity
            </h2>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Create a unique online presence. Artisans, woodworkers, oil producers, and surfers list together.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Shop Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Essaouira Thuya Creations"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-[#111827] focus:border-[#6366F1] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Shop Web Address URL Slug *
              </label>
              <div className="flex rounded-2xl border border-gray-200 bg-gray-50 overflow-hidden focus-within:ring-1 focus-within:ring-[#6366F1] focus-within:border-[#6366F1] transition-all">
                <span className="flex items-center px-4 text-xs font-semibold text-gray-500 select-none bg-gray-100 border-r border-gray-200">
                  mogador.app/store/
                </span>
                <input
                  type="text"
                  required
                  placeholder="essaouira-thuya"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  className="w-full bg-white px-4 py-2.5 text-sm text-[#111827] focus:outline-none"
                />
              </div>
              <span className="block text-[10px] text-gray-400 font-semibold mt-1">This is how buyers will navigate directly to your shop catalog!</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Craft Specialty Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-[#111827] focus:border-[#6366F1] focus:outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="text-center max-w-md mx-auto mb-2 select-none">
            <h2 className="text-xl font-bold text-[#111827]" style={{ fontFamily: 'Syne, sans-serif' }}>
              Tell Your Brand Story
            </h2>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Upload visuals and describe the heritage of your craftsmanship to build trust with buyers.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Shop Location in Essaouira
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-[#111827] focus:border-[#6366F1] focus:outline-none"
              >
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Brand Heritage Story & Values *
              </label>
              <textarea
                required
                rows={4}
                placeholder="Share how you create, what materials are harvested locally, and the history behind your craft..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-[#111827] focus:border-[#6366F1] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
              />
            </div>

            {/* Media Uploaders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Logo Upload Box */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Shop Profile Logo
                </label>
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-2xl border border-gray-150 bg-gray-50 overflow-hidden shrink-0 flex items-center justify-center">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo preview" className="h-full w-full object-cover" />
                    ) : (
                      <StoreIcon className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <label className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 px-4 py-2.5 text-xs font-bold text-gray-600 cursor-pointer shadow-sm">
                    {uploadingLogo ? (
                      <Loader2 className="h-4 w-4 animate-spin text-[#6366F1]" />
                    ) : (
                      <>
                        <Upload className="h-4 w-4 text-gray-400" />
                        Logo Image
                      </>
                    )}
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={uploadingLogo} />
                  </label>
                </div>
              </div>

              {/* Banner Upload Box */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Shop Cover Banner
                </label>
                <div className="flex items-center gap-3">
                  <div className="h-14 w-24 rounded-2xl border border-gray-150 bg-gray-50 overflow-hidden shrink-0 flex items-center justify-center">
                    {bannerUrl ? (
                      <img src={bannerUrl} alt="Banner preview" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-gray-400 font-extrabold uppercase">1200x400</span>
                    )}
                  </div>
                  <label className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 px-4 py-2.5 text-xs font-bold text-gray-600 cursor-pointer shadow-sm">
                    {uploadingBanner ? (
                      <Loader2 className="h-4 w-4 animate-spin text-[#6366F1]" />
                    ) : (
                      <>
                        <Upload className="h-4 w-4 text-gray-400" />
                        Banner Image
                      </>
                    )}
                    <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" disabled={uploadingBanner} />
                  </label>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div className="text-center max-w-md mx-auto mb-2 select-none">
            <h2 className="text-xl font-bold text-[#111827]" style={{ fontFamily: 'Syne, sans-serif' }}>
              Launch Your Artisan Shop!
            </h2>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Review your storefront profile below. Once launched, you can start listing products instantly.
            </p>
          </div>

          {/* Premium Store Mockup Card */}
          <div className="rounded-2xl border border-gray-100 shadow-lg overflow-hidden bg-white select-none">
            {/* Banner Cover picture */}
            <div className="h-32 w-full bg-gray-100 relative">
              <img
                src={bannerUrl || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200'}
                alt="Store Banner Mock"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>

            {/* Overlapping Profile Logo Section */}
            <div className="px-6 pb-6 relative">
              <div className="-mt-10 mb-3 h-20 w-20 rounded-2xl border-4 border-white bg-white shadow-md overflow-hidden relative z-10 flex items-center justify-center">
                <img
                  src={logoUrl || 'https://images.unsplash.com/photo-1546213290-e1b492ab3eee?w=300'}
                  alt="Store Logo Mock"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex flex-col">
                <h3 className="text-lg font-bold text-[#111827] flex items-center gap-1.5" style={{ fontFamily: 'Syne, sans-serif' }}>
                  {name}
                  <span className="rounded bg-[#6366F1]/10 px-2 py-0.5 text-[8.5px] font-bold text-[#6366F1] uppercase">
                    {category}
                  </span>
                </h3>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                  📍 {location}
                </span>
                <p className="text-xs text-gray-500 mt-2 line-clamp-2 italic leading-relaxed">
                  "{description}"
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Button Navigation Panel */}
      <div className="flex items-center justify-between border-t border-gray-150 pt-6 mt-8 select-none">
        {step > 1 ? (
          <button
            onClick={prevStep}
            disabled={loading}
            className="flex items-center gap-1 rounded-xl border border-gray-200 hover:bg-gray-50 px-4 py-2.5 text-xs font-bold text-gray-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        ) : (
          <div /> // dummy alignment spacer
        )}

        {step < 3 ? (
          <button
            onClick={nextStep}
            className="flex items-center gap-1.5 rounded-xl bg-[#111827] hover:bg-[#6366F1] px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all cursor-pointer"
          >
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl bg-[#6366F1] hover:bg-[#6366F1]/90 px-6 py-2.5 text-xs font-bold text-white shadow-md transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Launching Shop...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Launch My Shop!
              </>
            )}
          </button>
        )}
      </div>

    </div>
  );
}
