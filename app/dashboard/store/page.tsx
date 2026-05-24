'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
import { useMyStore } from '@/hooks/useMyStore';
import { useSupabase } from '@/hooks/useSupabase';
import MarkdownEditor from '@/components/ui/MarkdownEditor';
import { Save, Store, Sparkles, Loader2, ArrowRight, Camera, HelpCircle } from 'lucide-react';

export default function DashboardStorePage() {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { store, loading } = useMyStore(user?.id);
  const supabase = useSupabase();

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize fields once loaded
  useEffect(() => {
    if (store) {
      setName(store.name || '');
      setDescription(store.description || '');
      setCategory(store.category || '');
      setLogoUrl(store.logo_url || '');
    }
  }, [store]);

  // Update store details mutation
  const updateStoreMutation = useMutation({
    mutationFn: async (updatedData: {
      name: string;
      description: string;
      category: string;
      logo_url: string;
    }) => {
      if (!store?.id) return;
      
      const slug = updatedData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      const { data, error } = await supabase
        .from('stores')
        .update({
          name: updatedData.name,
          slug,
          description: updatedData.description,
          category: updatedData.category,
          logo_url: updatedData.logo_url,
        })
        .eq('id', store.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-store'] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    updateStoreMutation.mutate({
      name: name.trim(),
      description,
      category,
      logo_url: logoUrl.trim(),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 select-none">
        <Loader2 className="h-8 w-8 animate-spin text-[#18181B]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Page Header */}
      <div className="border-b border-gray-150 pb-5 select-none">
        <span className="text-[10px] font-bold tracking-widest text-[#18181B] uppercase">Workshop Profile</span>
        <h1 className="text-3xl font-extrabold text-[#18181B] mt-1" >
          Customize Workshop
        </h1>
      </div>

      {saveSuccess && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-[#10B981] select-none animate-in fade-in slide-in-from-top-2 duration-300">
          ✓ Workshop profile updated successfully.
        </div>
      )}

      {updateStoreMutation.isError && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-xs font-bold text-red-700 select-none">
          Failed to save changes. Please verify parameters and retry.
        </div>
      )}

      {/* 2-Column form parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT 8 COLS: Inputs editor forms */}
        <form onSubmit={handleSubmit} className="lg:col-span-8 bg-white rounded-3xl border border-[rgba(232,227,216,0.45)] p-6 sm:p-8 shadow-sm space-y-6">
          
          <h2 className="text-lg font-bold text-[#18181B] flex items-center gap-2 select-none" >
            <Store className="h-5 w-5 text-[#18181B]" />
            Artisan Shop Credentials
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Workshop Name */}
            <div>
              <label className="block text-[10px] font-extrabold text-[#71717A] uppercase tracking-widest mb-1.5 select-none">
                Workshop Brand Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Souiri Thuya Mastercraft"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-gray-250 bg-white px-4 py-2.5 text-xs text-[#18181B] font-semibold focus:border-[#18181B] focus:outline-none focus:ring-1 focus:ring-[#18181B]"
              />
            </div>

            {/* Shop Category */}
            <div>
              <label className="block text-[10px] font-extrabold text-[#71717A] uppercase tracking-widest mb-1.5 select-none">
                Heritage Specialty Specialty *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-gray-250 bg-white px-4 py-2.5 text-xs text-[#18181B] font-semibold focus:border-[#18181B] focus:outline-none"
              >
                <option value="Artisanal Wood">Artisanal Wood</option>
                <option value="Cosmetics & Oils">Cosmetics & Oils</option>
                <option value="Leather Goods">Leather Goods</option>
                <option value="Surf Gear">Surf Gear</option>
                <option value="Moroccan Rugs">Moroccan Rugs</option>
                <option value="Pottery & Ceramic">Pottery & Ceramic</option>
              </select>
            </div>

          </div>

          {/* Logo URL */}
          <div>
            <label className="block text-[10px] font-extrabold text-[#71717A] uppercase tracking-widest mb-1.5 select-none">
              Workshop Logo Asset URL
            </label>
            <div className="relative rounded-xl border border-gray-250 overflow-hidden focus-within:ring-1 focus-within:ring-[#18181B] focus-within:border-[#18181B] spring-transition">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#71717A]">
                <Camera className="h-4 w-4" />
              </span>
              <input
                type="url"
                placeholder="e.g. https://images.unsplash.com/photo-..."
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full bg-white pl-12 pr-4 py-2.5 text-xs text-[#18181B] font-semibold focus:outline-none"
              />
            </div>
          </div>

          {/* Description Markdown editor */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold text-[#71717A] uppercase tracking-widest select-none">
              Workshop Biography & Fair Trade Journey
            </label>
            <MarkdownEditor
              value={description}
              onChange={setDescription}
              placeholder="Detail your history, your materials, your workshops, and fair trade commitments..."
            />
          </div>

          {/* Action trigger button */}
          <div className="border-t border-[rgba(232,227,216,0.45)] pt-6 flex justify-end">
            <button
              type="submit"
              disabled={updateStoreMutation.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-[#18181B] hover:bg-[#18181B]/95 px-6 py-3 text-xs font-bold text-white shadow-md active:scale-95 spring-transition cursor-pointer"
            >
              {updateStoreMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Workshop Profiles...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>

        </form>

        {/* RIGHT 4 COLS: Shop Card Previews */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Card Preview */}
          <div className="bg-white rounded-3xl border border-[rgba(232,227,216,0.45)] p-6 shadow-md space-y-4">
            <h3 className="text-sm font-bold text-[#18181B] select-none" >
              Public Preview
            </h3>

            <div className="rounded-2xl border border-gray-150 overflow-hidden bg-white shadow-sm flex flex-col p-5 space-y-4 relative select-none">
              {/* Cover Glow */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#18181B]" />

              <div className="flex items-center gap-4 pt-2">
                <div className="h-14 w-14 rounded-xl overflow-hidden border border-[rgba(232,227,216,0.45)] bg-[#F5F0E8] flex items-center justify-center relative shrink-0">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
                  ) : (
                    <Store className="h-6 w-6 text-gray-300" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="font-extrabold text-sm text-[#18181B] truncate" >
                    {name || 'My Medina Workshop'}
                  </h4>
                  <span className="inline-block rounded-full bg-indigo-50 px-2.5 py-0.5 text-[8.5px] font-bold text-[#18181B] uppercase mt-1">
                    {category || 'Heritage Craft'}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-50 pt-3 text-[10px] text-[#71717A] font-semibold flex items-center gap-1">
                <Sparkles className="h-4 w-4 text-[#18181B]" />
                Fair Trade Medina Certified
              </div>
            </div>
          </div>

          {/* Help box */}
          <div className="bg-[#F5F0E8]/50 border border-[rgba(232,227,216,0.8)] rounded-3xl p-6 space-y-3 select-none leading-relaxed">
            <h4 className="font-bold text-xs text-[#18181B] flex items-center gap-1">
              <HelpCircle className="h-4 w-4 text-[#71717A]" /> Need Help?
            </h4>
            <p className="text-[10px] text-[#71717A] font-light">
              Your biography description supports markdown (e.g. bold headings, quotes, checklists). Tell customer stories about how your wood crafts or argan oils are sourced.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
