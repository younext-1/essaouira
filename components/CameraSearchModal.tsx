'use client';

import { useState, useRef } from 'react';
import { Camera, X, Loader2, ArrowRight, Sparkles, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { Product } from '@/types';
import { compressImage } from '@/lib/upload';

interface CameraSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CameraSearchModal({ isOpen, onClose }: CameraSearchModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<{ category: string; keywords: string[]; products: Product[] } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      setErrorMsg('Veuillez sélectionner un fichier image valide (PNG, JPG, WEBP).');
      return;
    }

    setFile(selectedFile);
    setErrorMsg(null);
    setResults(null);

    // 1. Create a local preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);

    // 2. Compress and send to Gemini Image Search API
    setAnalyzing(true);
    try {
      // Compress to maximum 600px width/height to ensure ultra-fast token transfer
      const compressedBlob = await compressImage(selectedFile, 600, 600, 0.8);
      
      // Convert compressed blob to base64
      const base64Reader = new FileReader();
      base64Reader.readAsDataURL(compressedBlob);
      base64Reader.onloadend = async () => {
        const base64data = base64Reader.result as string;
        
        try {
          const response = await fetch('/api/search-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64data })
          });

          const data = await response.json();
          if (data.error) {
            throw new Error(data.error);
          }

          setResults({
            category: data.category,
            keywords: data.keywords || [],
            products: data.products || []
          });
        } catch (err: any) {
          console.error(err);
          setErrorMsg(err.message || 'فشل الاتصال بمحرك البحث الذكي.');
        } finally {
          setAnalyzing(false);
        }
      };

    } catch (compressErr) {
      console.error(compressErr);
      setErrorMsg('فشل تحسين وضغط الصورة.');
      setAnalyzing(false);
    }
  };

  const resetSearch = () => {
    setFile(null);
    setPreviewUrl('');
    setResults(null);
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans select-none animate-in fade-in duration-300">
      
      {/* Outer Close Clickarea */}
      <div className="absolute inset-0 cursor-default" onClick={onClose} />

      {/* Modal Card Frame */}
      <div className="relative w-full max-w-md bg-[#FAFAF7] border border-[rgba(232,227,216,0.45)] rounded-[28px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-6 duration-300 z-10" style={{ direction: 'rtl' }}>
        
        {/* Header */}
        <div className="bg-[#1C1917] text-white px-5 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="h-8.5 w-8.5 rounded-xl bg-gradient-to-tr from-[#E61E42] to-amber-500 flex items-center justify-center text-white">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="font-sans font-black text-sm text-white">البحث الذكي بالصور</h3>
              <span className="text-[9px] text-gray-400 block font-light">مدعوم بذكاء الاصطناعي Gemini AI</span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer active-push"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[480px]">
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />

          {/* Upload Selector Block when no preview is present */}
          {!previewUrl && (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#EBEAE4] hover:border-[#E61E42] hover:bg-[#FFEBEF]/10 rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 group"
            >
              <div className="h-12 w-12 rounded-xl bg-[#F5F0E8] group-hover:bg-[#FFEBEF] text-gray-400 group-hover:text-[#E61E42] flex items-center justify-center mx-auto mb-3 transition-colors">
                <Camera className="w-6 h-6" />
              </div>
              <h4 className="text-xs font-black text-[#1C1917]">التقط صورة أو ارفع ملف</h4>
              <p className="text-[10px] text-gray-450 mt-1 font-light">التقط صورة لمنتج مغربي أو حرفة تقليدية لنبحث لك عنها!</p>
            </div>
          )}

          {/* Preview Image Block */}
          {previewUrl && (
            <div className="relative rounded-2xl overflow-hidden border border-[#EBEAE4] bg-white aspect-[4/3] flex items-center justify-center shadow-inner">
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              
              {/* Analyzing Loader Overlay Mask */}
              {analyzing && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-white text-center p-4">
                  <Loader2 className="w-10 h-10 text-[#FFD43F] animate-spin mb-3" />
                  <p className="text-xs font-black">Gemini AI يحلل تفاصيل الصورة...</p>
                  <p className="text-[10px] text-gray-300 font-light mt-1">يتم البحث عن الصويرة وتصنيف السجاد، الأركان والخشب العرعر</p>
                </div>
              )}

              {/* Reset Upload Button */}
              {!analyzing && (
                <button 
                  onClick={resetSearch}
                  className="absolute bottom-3 left-3 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 text-xs shadow-md transition-colors cursor-pointer active-push"
                  title="إلغاء البحث"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Search Result Products Display Grid */}
          {results && (
            <div className="space-y-3 animate-in fade-in duration-300">
              
              {/* Classification Info Pill */}
              <div className="bg-[#FFEBEF] border border-[#FCA5A5] rounded-xl p-3 flex flex-col gap-1 text-[11px]">
                <div className="flex items-center gap-1.5 text-[#E61E42] font-black">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>نتائج التصنيف الذكي:</span>
                </div>
                <div className="mt-1 space-y-0.5 font-bold text-gray-700">
                  <p>الفئة المكتشفة: <span className="text-[#1C1917] font-black">{results.category}</span></p>
                  {results.keywords.length > 0 && (
                    <p>الكلمات المفتاحية: <span className="text-[#1C1917] font-black">{results.keywords.join(', ')}</span></p>
                  )}
                </div>
              </div>

              {/* Products Title */}
              <h4 className="text-[11px] font-black text-gray-500 uppercase tracking-widest">
                📦 المنتجات المطابقة في المعرض:
              </h4>

              {results.products.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 pb-1">
                  {results.products.map((p) => {
                    const imgCover = p.images && p.images.length > 0 ? p.images[0] : p.thumbnail_url || '/placeholder.jpg';
                    return (
                      <Link 
                        key={p.id} 
                        href={`/product/${p.id}`}
                        onClick={onClose}
                        className="group/item border border-[#EBEAE4] bg-white rounded-xl overflow-hidden p-2 flex flex-col justify-between hover:shadow-md transition-shadow h-44"
                      >
                        <div className="aspect-[4/3] w-full rounded-lg overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                          <img src={imgCover} alt={p.name} className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-500" />
                        </div>
                        <div className="flex-1 flex flex-col justify-between pt-1.5">
                          <h5 className="text-[9.5px] font-bold text-gray-800 line-clamp-1 group-hover/item:text-[#CA8A04] transition-colors">{p.name}</h5>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10.5px] font-black text-red-500">{p.price} DH</span>
                            <span className="text-[8px] text-gray-400 font-light flex items-center gap-0.5">تفاصيل <ArrowRight className="w-2.5 h-2.5" /></span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                // Empty Products Result state
                <div className="text-center py-6 border border-[#EBEAE4] rounded-2xl bg-white">
                  <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-[11px] font-black text-gray-800">عذراً، لم نجد منتجات مطابقة تماماً حالياً</p>
                  <p className="text-[9px] text-gray-400 font-light mt-0.5">حاول تصوير المنتج بزاوية مختلفة أو إضاءة أوضح!</p>
                </div>
              )}
            </div>
          )}

          {/* Upload and Search Errors Banner */}
          {errorMsg && (
            <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600 border border-red-100 flex items-center gap-2 animate-fade-in">
              <X className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
