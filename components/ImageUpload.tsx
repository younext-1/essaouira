'use client';

import { useState, useRef } from 'react';
import { UploadCloud, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { compressImage, uploadProductImage } from '@/lib/upload';

interface ImageUploadProps {
  onUploadComplete: (url: string) => void;
  onRemove: () => void;
  initialValue?: string;
}

export default function ImageUpload({ onUploadComplete, onRemove, initialValue = '' }: ImageUploadProps) {
  const { getToken } = useAuth();
  const [previewUrl, setPreviewUrl] = useState<string>(initialValue);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate if file is an image
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Veuillez sélectionner un fichier image valide (PNG, JPG, WEBP).');
      return;
    }

    setErrorMsg(null);
    setIsCompressing(true);

    try {
      // 1. Client-side canvas compression (optimizes dimensions to max 1200px and JPEG quality to 80%)
      const compressedBlob = await compressImage(file, 1200, 1200, 0.85);
      setIsCompressing(false);
      setIsUploading(true);

      // 2. Upload to Supabase Storage
      const { publicUrl, error } = await uploadProductImage(compressedBlob, file.name, getToken);

      if (error) {
        throw new Error(error);
      }

      if (publicUrl) {
        setPreviewUrl(publicUrl);
        onUploadComplete(publicUrl);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Une erreur est survenue lors de l\'upload.');
    } finally {
      setIsCompressing(false);
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl('');
    onRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2 pb-2">
      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
        Image du Produit
      </label>

      {previewUrl ? (
        // Preview State Image Container
        <div className="relative group overflow-hidden rounded-2xl border border-[#EBEAE4] bg-gray-50 h-52 flex items-center justify-center transition-all duration-300">
          <img
            src={previewUrl}
            alt="Preview upload"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-[#111827]/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
            <button
              type="button"
              onClick={handleRemove}
              className="rounded-full bg-white p-3 text-red-600 hover:bg-red-50 shadow-md transform hover:scale-110 active:scale-95 transition-all cursor-pointer"
              title="Supprimer l'image"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : (
        // Upload Action Selector Box
        <div
          onClick={() => !isUploading && !isCompressing && fileInputRef.current?.click()}
          className={`relative group border-2 border-dashed rounded-2xl h-52 flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all duration-300 ${
            isUploading || isCompressing
              ? 'border-indigo-400 bg-indigo-50/10 cursor-not-allowed'
              : 'border-[#EBEAE4] hover:border-[#6366F1] hover:bg-[#6366F1]/5'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            disabled={isUploading || isCompressing}
            className="hidden"
          />

          {isCompressing ? (
            <div className="space-y-2 animate-pulse">
              <Loader2 className="mx-auto h-10 w-10 text-[#6366F1] animate-spin" />
              <p className="text-xs font-bold text-[#111827]">Optimisation & Compression...</p>
              <p className="text-[10px] text-gray-500">Calcul du canevas pour réduire l'espace disque</p>
            </div>
          ) : isUploading ? (
            <div className="space-y-2">
              <Loader2 className="mx-auto h-10 w-10 text-emerald-600 animate-spin" />
              <p className="text-xs font-bold text-[#111827]">Transfert vers Supabase Storage...</p>
              <p className="text-[10px] text-gray-500">Hébergement sécurisé dans le Cloud</p>
            </div>
          ) : (
            <div className="space-y-2 group-hover:scale-102 transition-transform duration-300">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center transition-all duration-300 group-hover:bg-indigo-50 group-hover:text-[#6366F1]">
                <UploadCloud className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#111827]">Choisir un fichier image</p>
                <p className="text-[10px] text-gray-400 mt-1">Format PNG, JPG, ou WEBP (Max 10 Mo)</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload Error banner */}
      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600 border border-red-100 animate-fade-in">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
