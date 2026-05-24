'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
import { useMyStore } from '@/hooks/useMyStore';
import { useSupabase } from '@/hooks/useSupabase';
import { 
  ShieldAlert, Trash2, ShieldX, HelpCircle, 
  Loader2, Sparkles, Key, Landmark 
} from 'lucide-react';

export default function DashboardSettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { store, loading } = useMyStore(user?.id);
  const supabase = useSupabase();

  const [archiveSuccess, setArchiveSuccess] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Close/Archive store temporarily mutation
  const archiveStoreMutation = useMutation({
    mutationFn: async (isArchived: boolean) => {
      if (!store?.id) return;
      const { error } = await supabase
        .from('stores')
        .update({ description: `${store.description || ''}\n\n[ARCHIVED]` })
        .eq('id', store.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-store'] });
      setArchiveSuccess(true);
      setTimeout(() => setArchiveSuccess(false), 3000);
    },
  });

  // Permanently delete store mutation
  const deleteStoreMutation = useMutation({
    mutationFn: async () => {
      if (!store?.id) return;

      // 1. Delete product variants
      const { data: pData } = await supabase.from('products').select('id').eq('store_id', store.id);
      const productIds = (pData || []).map(p => p.id);
      if (productIds.length > 0) {
        await supabase.from('product_variants').delete().in('product_id', productIds);
      }

      // 2. Delete products listed
      await supabase.from('products').delete().eq('store_id', store.id);

      // 3. Delete store record
      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', store.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-store'] });
      setShowDeleteModal(false);
      router.push('/');
    },
  });

  const handlePermanentDelete = (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmText !== 'DELETE PERMANENTLY') return;
    deleteStoreMutation.mutate();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 select-none">
        <Loader2 className="h-8 w-8 animate-spin text-[#18181B]" />
      </div>
    );
  }

  return (
    <div className="space-y-8" >
      
      {/* Editorial Header */}
      <div className="border-b border-gray-150 pb-5 select-none space-y-1">
        <span className="text-[10px] font-bold tracking-widest text-[#18181B] uppercase">Workshop Parameters</span>
        <h1 className="text-3xl font-extrabold text-[#18181B]" >
          Store Settings
        </h1>
      </div>

      {archiveSuccess && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-[#10B981] select-none animate-in fade-in slide-in-from-top-2 duration-300">
          ✓ Workshop archive parameters updated successfully.
        </div>
      )}

      {/* Main grids */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT 8 COLS: Disbursement ledger configs */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Card: Payout Account */}
          <div className="rounded-3xl border border-[rgba(232,227,216,0.45)] bg-white p-6 shadow-sm space-y-4 select-none">
            <h2 className="text-base font-bold text-[#18181B] flex items-center gap-2" >
              <Landmark className="h-5 w-5 text-[#18181B]" />
              Artisan Payout Ledger
            </h2>

            <div className="rounded-2xl border border-gray-150 p-4 flex items-center justify-between bg-[#F5F0E8]/50">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center text-[#18181B]">
                  <Landmark className="h-4.5 w-4.5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-900">Attijariwafa Bank Ledger</span>
                  <span className="text-[9px] text-[#71717A] font-extrabold uppercase">Direct Wire Disbursement</span>
                </div>
              </div>
              <span className="rounded-lg bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-[#10B981] uppercase tracking-wide">
                Active Setup
              </span>
            </div>

            <p className="text-[10px] text-[#71717A] leading-relaxed font-semibold">
              Payouts are disbursed every Friday at 17:00 local Moroccan time for all escrow packages verified delivered by couriers.
            </p>
          </div>

          {/* Card: Temporary shop archives */}
          <div className="rounded-3xl border border-[rgba(232,227,216,0.45)] bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-[#18181B] flex items-center gap-2 select-none" >
              <Key className="h-5 w-5 text-[#18181B]" />
              Workshop Archive
            </h2>

            <div className="flex justify-between items-center text-xs">
              <div className="space-y-0.5 min-w-0 pr-4 select-none">
                <span className="font-bold text-gray-900 block">Archive Public Listings</span>
                <span className="text-[10px] text-[#71717A] leading-relaxed font-semibold block">
                  Temporarily suspend your products from appearing on buyer catalog home grids. You can re-activate anytime.
                </span>
              </div>
              
              <button
                onClick={() => archiveStoreMutation.mutate(true)}
                disabled={archiveStoreMutation.isPending}
                className="rounded-xl border border-gray-250 hover:bg-[#F5F0E8] px-4 py-2 text-xs font-bold text-[#71717A] transition-colors shrink-0 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {archiveStoreMutation.isPending ? 'Archiving...' : 'Archive Store'}
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT 4 COLS: Danger Zone permanent delete controls */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Card: DANGER ZONE */}
          <div className="rounded-3xl border border-red-100 bg-red-50/10 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-red-500 flex items-center gap-1.5 select-none" >
              <ShieldAlert className="h-5 w-5 text-red-500" />
              Danger Zone
            </h2>

            <p className="text-[10px] text-[#71717A] leading-relaxed font-semibold select-none">
              Permanently close and delete your Medina workshop account. All active products list and variant settings will be instantly wiped out from the platform database!
            </p>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-red-500 hover:bg-red-600 text-white py-2.5 text-xs font-bold shadow-sm spring-transition cursor-pointer select-none"
            >
              <Trash2 className="h-4.5 w-4.5" /> Close Workshop Shop
            </button>
          </div>

          {/* Guild assurances */}
          <div className="bg-indigo-50/30 border border-indigo-100 rounded-3xl p-6 space-y-3 select-none leading-relaxed">
            <h3 className="font-bold text-xs text-[#18181B] flex items-center gap-1">
              <Sparkles className="h-4 w-4 text-[#18181B]" /> Heritage Collective
            </h3>
            <p className="text-[10px] text-[#71717A] font-light">
              Closing a shop requires zero outstanding buyer escrow deliveries. All open order tickets must first be marked delivered.
            </p>
          </div>

        </div>

      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18181B]/60 backdrop-blur-sm animate-fade-in select-none">
          <form 
            onSubmit={handlePermanentDelete} 
            className="w-full max-w-sm rounded-2xl bg-white border border-[rgba(232,227,216,0.45)] p-6 shadow-2xl animate-scale-up text-center space-y-4"
          >
            <ShieldX className="mx-auto h-10 w-10 text-red-500 mb-2 animate-bounce" />
            <h4 className="font-bold text-lg text-red-500" >Delete Store Permanently?</h4>
            <p className="text-xs leading-relaxed text-[#71717A] font-light">
              This will permanently remove your shop, list records, and active options. Type <strong className="text-red-500">DELETE PERMANENTLY</strong> below to execute.
            </p>

            <input
              type="text"
              required
              placeholder="Type DELETE PERMANENTLY"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full rounded-xl border border-red-150 bg-white px-3 py-2.5 text-xs text-[#18181B] font-bold text-center focus:outline-none"
            />

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                className="rounded-xl border border-[rgba(232,227,216,0.8)] px-4 py-2 text-xs font-bold text-[#71717A] hover:bg-[#F5F0E8] spring-transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={deleteConfirmText !== 'DELETE PERMANENTLY' || deleteStoreMutation.isPending}
                className="rounded-xl bg-red-500 px-5 py-2 text-xs font-bold text-white hover:bg-red-600 spring-transition disabled:opacity-50 cursor-pointer"
              >
                {deleteStoreMutation.isPending ? 'Wiping...' : 'Destroy Workshop'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
