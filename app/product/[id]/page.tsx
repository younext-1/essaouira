'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useUser, useClerk } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase';
import { useProduct } from '@/hooks/useProduct';
import { useReviews } from '@/hooks/useReviews';
import { useMyReview } from '@/hooks/useMyReview';
import { useDeleteReview } from '@/hooks/useDeleteReview';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import StarRating from '@/components/StarRating';
import RatingBreakdown from '@/components/RatingBreakdown';
import ReviewCard from '@/components/ReviewCard';
import ReviewModal from '@/components/ReviewModal';
import { 
  ArrowLeft, Loader2, MessageSquarePlus, Star, ChevronDown, Trash2, 
  ShoppingBag, Check, Heart, Plus, Minus, ShieldCheck, Truck, Sparkles, 
  Eye, Flame, Trophy, UploadCloud, X, Play, Volume2, VolumeX, Maximize2, 
  FileVideo, Camera
} from 'lucide-react';
import Link from 'next/link';
import WhatsAppButton from '@/components/ui/whatsapp-button';
import { ProductContext } from '@/lib/whatsapp/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);
  const { user, isLoaded: isUserLoaded, isSignedIn } = useUser();
  const clerk = useClerk();

  // Queries
  const { data: product, isLoading: isProductLoading, error: productError } = useProduct(id);
  const { addToCart, addToCartLoading } = useCart();
  const { isInWishlist, toggleWishlist, toggleWishlistLoading } = useWishlist();

  // Component States
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [sortBy, setSortBy] = useState<'recent' | 'highest' | 'helpful'>('recent');
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmReview, setDeleteConfirmReview] = useState<string | null>(null);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState<'description' | 'shipping'>('description');
  const [showFloating, setShowFloating] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowFloating(true);
      } else {
        setShowFloating(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Promotion States
  const [selectedBundle, setSelectedBundle] = useState<'single' | 'double' | 'triple'>('single');
  const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 44, seconds: 12 });
  const [viewerCount, setViewerCount] = useState(7);

  // Local Storage Visual Reviews & Media States
  const [localReviews, setLocalReviews] = useState<any[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [uploadedMedia, setUploadedMedia] = useState<{type: 'image' | 'video', url: string}[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [lightboxItem, setLightboxItem] = useState<{type: 'image' | 'video', url: string, userName?: string, rating?: number, text?: string} | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isWritePanelOpen, setIsWritePanelOpen] = useState(false);

  // Dynamic promo countdown countdown effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { hours: 2, minutes: 44, seconds: 12 }; // demo looping
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Dynamic live viewer counter simulator for social proof FOMO
  useEffect(() => {
    const interval = setInterval(() => {
      setViewerCount(prev => {
        const change = Math.random() > 0.5 ? 1 : -1;
        const next = prev + change;
        return next >= 3 && next <= 15 ? next : prev;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Load reviews with visual files from LocalStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(`mogador_media_reviews_${id}`);
    if (saved) {
      setLocalReviews(JSON.parse(saved));
    } else {
      const defaults = [
        {
          id: 'mock-rev-1',
          userName: 'أمينة بنجلون',
          rating: 5,
          text: 'الزربية البربرية في غاية الروعة! الألوان متناسقة جداً وصوف طبيعي 100٪. الشحن كان سريعاً جداً والتغليف ممتاز. شكراً لمعلمي الصويرة! ⛺✨',
          timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
          media: [
            { type: 'image', url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800' }
          ]
        },
        {
          id: 'mock-rev-2',
          userName: 'Arthur Dupont',
          rating: 5,
          text: 'Superb Thuya wooden box! The cedar scent is absolutely gorgeous. Inherited artisan craftsmanship is fully evident. 🪵',
          timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
          media: [
            { type: 'video', url: 'https://assets.mixkit.co/videos/preview/mixkit-hand-carving-a-wooden-bowl-with-a-chisel-42217-large.mp4' }
          ]
        }
      ];
      localStorage.setItem(`mogador_media_reviews_${id}`, JSON.stringify(defaults));
      setLocalReviews(defaults);
    }
  }, [id]);

  // Pre-select first option for each variant group
  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      const initial: Record<string, string> = {};
      product.variants.forEach((v) => {
        if (!initial[v.name]) {
          initial[v.name] = v.value || '';
        }
      });
      setSelectedVariants(initial);
    }
  }, [product]);

  // Adjust quantity based on chosen bundle
  useEffect(() => {
    if (selectedBundle === 'single') setQuantity(1);
    if (selectedBundle === 'double') setQuantity(2);
    if (selectedBundle === 'triple') setQuantity(3);
  }, [selectedBundle]);

  // Local media upload & drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const processFile = (file: File) => {
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    
    if (!isVideo && !isImage) {
      alert('Only images and videos are supported!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setUploadedMedia(prev => [
        ...prev,
        { type: isVideo ? 'video' : 'image', url: dataUrl }
      ]);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      Array.from(e.dataTransfer.files).forEach(processFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      Array.from(e.target.files).forEach(processFile);
    }
  };

  const handleRemoveMedia = (index: number) => {
    setUploadedMedia(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitLocalReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) return;

    const newReview = {
      id: `local-rev-${Date.now()}`,
      userName: user?.fullName || 'زائر موكادور',
      rating: reviewRating,
      text: reviewText,
      timestamp: new Date().toISOString(),
      media: uploadedMedia
    };

    const updated = [newReview, ...localReviews];
    localStorage.setItem(`mogador_media_reviews_${id}`, JSON.stringify(updated));
    setLocalReviews(updated);
    
    // Clear form
    setReviewText('');
    setUploadedMedia([]);
    setReviewRating(5);
    setIsWritePanelOpen(false);
  };

  // Reviews queries
  const { data: reviews = [], isLoading: isReviewsLoading } = useReviews({
    productId: id,
    sortBy,
    starFilter,
    limit: 30,
  });
  const { data: myReview } = useMyReview(id);
  const deleteMutation = useDeleteReview();

  // Query just the rating list for distribution calculations
  const { data: ratingRows } = useQuery({
    queryKey: ['reviews-distribution', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('rating')
        .eq('product_id', id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Calculate distributions in-memory
  const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let totalReviewsCount = 0;

  if (ratingRows) {
    totalReviewsCount = ratingRows.length;
    ratingRows.forEach((row) => {
      distribution[row.rating] = (distribution[row.rating] || 0) + 1;
    });
  }

  const handleWriteReviewClick = () => {
    if (!isUserLoaded) return;
    if (!user) {
      clerk.openSignIn();
      return;
    }
    setIsModalOpen(true);
  };

  const handleDeleteClick = (reviewId: string) => {
    setDeleteConfirmReview(reviewId);
  };

  const confirmDeleteReview = async () => {
    if (!deleteConfirmReview) return;
    try {
      await deleteMutation.mutateAsync({
        id: deleteConfirmReview,
        productId: id,
      });
      setDeleteConfirmReview(null);
    } catch (err) {
      console.error('Failed to delete review:', err);
    }
  };

  if (isProductLoading) {
    return (
      <div className="w-full min-h-screen bg-[#F9FAFB] flex flex-col" >
        <div className="flex-1 flex flex-col items-center justify-center py-20 select-none">
          <Loader2 className="h-10 w-10 animate-spin text-[#18181B]" />
          <p className="mt-4 text-xs font-extrabold text-[#71717A] uppercase tracking-widest animate-pulse">
            Loading Craft Presentation...
          </p>
        </div>
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className="w-full min-h-screen bg-[#F9FAFB] flex flex-col" >
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4 select-none">
          <h3 className="font-bold text-2xl text-[#18181B] mb-2" >Craft Not Found</h3>
          <p className="text-xs text-[#71717A] mb-6">The product you are trying to view does not exist or has been removed.</p>
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-[#18181B] border-b border-[#18181B] hover:text-[#18181B] hover:border-[#18181B] pb-0.5 spring-transition">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Catalog
          </Link>
        </div>
      </div>
    );
  }

  const basePrice = Number(product.price);
  const isOutOfStock = product.stock === 0;

  // Calculate pricing discounts based on bundle selections
  let discountPercent = 0;
  if (selectedBundle === 'double') discountPercent = 10;
  if (selectedBundle === 'triple') discountPercent = 15;

  const adjustedPrice = Math.round(basePrice * (1 - discountPercent / 100));
  const totalPrice = adjustedPrice * quantity;

  // Resolve cover image and visual carousel images list
  const visualAssets = product.images && product.images.length > 0
    ? product.images
    : [(product as any).image_url || '/placeholder.jpg'];

  const favorited = isInWishlist(product.id);

  const productContext: ProductContext = {
    pageType: 'product',
    productId: product.id,
    productName: product.name,
    productNameAr: (product as any).name_ar || undefined,
    storeName: product.stores?.name || 'Local Workshop',
    storeId: product.store_id,
    category: (product as any).category?.name || 'Craft',
    price: product.price,
    comparePrice: product.compare_price || product.compare_at_price || undefined,
    inStock: product.stock > 0,
    stockCount: product.stock,
    productType: product.type || 'physical',
    rating: product.avg_rating || 5.0,
    totalReviews: (product as any).total_reviews || 0,
    duration: (product as any).experience_details?.duration_hours,
    maxParticipants: (product as any).experience_details?.max_participants,
    meetingPoint: (product as any).experience_details?.meeting_point,
  };

  // Group variants by option name
  const variantsGrouped: Record<string, typeof product.variants> = {};
  if (product.variants && product.variants.length > 0) {
    product.variants.forEach((v) => {
      if (!variantsGrouped[v.name]) {
        variantsGrouped[v.name] = [];
      }
      variantsGrouped[v.name]!.push(v);
    });
  }

  const handleVariantSelect = (optionName: string, optionValue: string) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [optionName]: optionValue,
    }));
  };

  const handleAddToCart = async () => {
    if (!isSignedIn) {
      clerk.openSignIn();
      return;
    }

    // Check: verify if all variants groups have been selected
    const requiredGroups = Object.keys(variantsGrouped);
    const unselected = requiredGroups.filter((g) => !selectedVariants[g]);

    if (unselected.length > 0) {
      alert(`Please pick options for: ${unselected.join(', ')}`);
      return;
    }

    try {
      // Map bundle discount selection inside variant descriptors seamlessly
      const finalVariants = {
        ...selectedVariants,
        ...(selectedBundle !== 'single' 
          ? { 'Bundle Offer': selectedBundle === 'double' ? 'Duo Saver (10% Off)' : 'Medina Bundle (15% Off)' } 
          : {}
        )
      };

      await addToCart({
        productId: product.id,
        quantity,
        variant: Object.keys(finalVariants).length > 0 ? finalVariants : null,
      });
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 2500);
    } catch (err: any) {
      const message = err?.message || err?.details || JSON.stringify(err);
      console.error('Add to cart error:', message, err);
      alert(`فشل الإضافة إلى السلة: ${message}`);
    }
  };

  const handleWishlistClick = async () => {
    if (!isSignedIn) {
      clerk.openSignIn();
      return;
    }
    await toggleWishlist(product.id);
  };

  // Convert markdown to clean, basic HTML elements securely (simple replacement engine)
  const renderMarkdown = (md: string) => {
    if (!md) return '';
    let html = md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    html = html.replace(/^##\s+(.+)$/gm, '<h4 class="text-xs font-extrabold text-gray-900 mt-4 mb-1.5 uppercase">$1</h4>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/^\s*-\s+(.+)$/gm, '<li class="list-disc ml-4 text-[#71717A] my-0.5">$1</li>');
    return html.split(/\n{2,}/).map(p => {
      if (p.trim().startsWith('<h') || p.trim().startsWith('<li')) return p;
      return `<p class="text-xs text-[#71717A] leading-relaxed mb-2.5">${p.replace(/\n/g, '<br />')}</p>`;
    }).join('');
  };

  return (
    <div className="w-full min-h-screen bg-[#F9FAFB] pb-20" >

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Breadcrumbs back navigation */}
        <div className="mb-8 select-none">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#71717A] hover:text-[#18181B] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </Link>
        </div>

        {/* Master Details Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start animate-in fade-in duration-300">
          
          {/* LEFT 5 COLS: Image selector gallery */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-28">
            <div className="rounded-3xl border border-[rgba(232,227,216,0.45)] bg-white shadow-md overflow-hidden select-none relative aspect-square w-full">
              {(product as any).category?.name && (
                <span className="absolute top-4 left-4 z-10 rounded-lg bg-[#18181B]/90 px-3 py-1 text-[9px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
                  <Trophy className="h-3 w-3 text-yellow-400" />
                  {(product as any).category.name}
                </span>
              )}
              <img
                src={visualAssets[activeImageIdx]}
                alt={product.name}
                className="h-full w-full object-cover hover:scale-105 transition-transform duration-500"
              />
              {isOutOfStock && (
                <div className="absolute inset-0 bg-[#18181B]/60 flex items-center justify-center z-10">
                  <span className="rounded-xl bg-white px-5 py-2 text-xs font-extrabold text-[#18181B] uppercase tracking-widest shadow-md">
                    Sold Out
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail carousel selector */}
            {visualAssets.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-1 select-none no-scrollbar">
                {visualAssets.map((url, idx) => (
                  <button
                    key={`${url}-${idx}`}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`h-16 w-16 rounded-2xl border overflow-hidden shrink-0 spring-transition cursor-pointer ${
                      activeImageIdx === idx 
                        ? 'border-[#18181B] ring-2 ring-[#18181B]/20 scale-105' 
                        : 'border-[rgba(232,227,216,0.8)] hover:border-gray-400'
                    }`}
                  >
                    <img src={url} alt="product thumbnail" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT 7 COLS: Metadata Checkout Forms and Review Feed */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Countdown Flash Promo Header */}
            {product.compare_price && product.compare_price > basePrice && (
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-4 text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md select-none animate-pulse">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-white animate-spin shrink-0" style={{ animationDuration: '3.5s' }} />
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-widest block">Special Medina Promo / عرض خاص</span>
                    <p className="text-[10px] opacity-90 font-medium">Fair-Trade Masterpiece at direct workshop price</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-xs font-bold bg-black/20 rounded-xl px-3.5 py-1.5 shrink-0">
                  <span>Ends in:</span>
                  <span className="bg-white text-orange-600 px-1.5 py-0.5 rounded-md">{String(timeLeft.hours).padStart(2, '0')}</span>:
                  <span className="bg-white text-orange-600 px-1.5 py-0.5 rounded-md">{String(timeLeft.minutes).padStart(2, '0')}</span>:
                  <span className="bg-white text-orange-600 px-1.5 py-0.5 rounded-md">{String(timeLeft.seconds).padStart(2, '0')}</span>
                </div>
              </div>
            )}

            {/* 1. Basic Details Card */}
            <div className="rounded-3xl border border-[rgba(232,227,216,0.45)] bg-white p-6 sm:p-8 shadow-md space-y-6">
              
              {/* Product title and Vendor links */}
              <div>
                <div className="flex justify-between items-center mb-1">
                {product.stores ? (
                    <Link
                      href={`/store/${product.stores.slug || product.stores.id}`}
                      className="text-xs font-extrabold text-[#18181B] hover:underline uppercase tracking-wide flex items-center gap-1"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      by {product.stores.name}
                    </Link>
                  ) : (
                    <span className="text-xs font-extrabold text-[#71717A] uppercase tracking-wide">
                      Local Workshop
                    </span>
                  )}

                  {product.stock > 0 && product.stock <= 3 && (
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 rounded-lg px-2 py-0.5 animate-pulse">
                      Urgent: Only {product.stock} left in stock
                    </span>
                  )}
                </div>

                <h1 className="text-3xl font-extrabold text-[#18181B] tracking-tight leading-tight" >
                  {product.name}
                </h1>

                {/* Rating row summary */}
                <div className="flex items-center gap-2 mt-2 select-none">
                  <StarRating rating={product.avg_rating ?? 5.0} size="sm" />
                  <span className="text-xs text-[#71717A] font-bold">
                    {product.avg_rating ? product.avg_rating.toFixed(1) : '5.0'} ({(product as any).total_reviews || 0} reviews)
                  </span>
                </div>
              </div>

              {/* Scarcity social proof metrics block */}
              <div className="space-y-2 select-none border-t border-b border-gray-50 py-3.5 text-xs">
                <div className="flex items-center gap-2 text-red-600 font-bold">
                  <Flame className="h-4 w-4 animate-bounce text-red-500 shrink-0" />
                  <span>🔥 14 authentic items sold in the last 3 hours for this studio</span>
                </div>
                <div className="flex items-center gap-2 text-[#71717A]">
                  <Eye className="h-4 w-4 text-[#CA8A04] shrink-0" />
                  <span>
                    <strong className="text-[#18181B]">{viewerCount} customers</strong> are currently inspecting this craft in Essaouira
                  </span>
                </div>
              </div>

              {/* Interactive Bundled Offer Box Selector (presenting absolute premium deals) */}
              {!isOutOfStock && (
                <div className="space-y-3 select-none">
                  <span className="block text-[10px] font-extrabold text-[#71717A] uppercase tracking-widest flex items-center gap-1">
                    <Trophy className="h-3.5 w-3.5 text-[#18181B]" />
                    Select Your Offer & Save / اختر عرضك المفضل ووفر
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    
                    {/* Single Offer */}
                    <button
                      type="button"
                      onClick={() => setSelectedBundle('single')}
                      className={`rounded-2xl border p-4 text-left spring-transition cursor-pointer flex flex-col justify-between h-28 relative overflow-hidden ${
                        selectedBundle === 'single'
                          ? 'border-[#18181B] bg-[#FAFAF7] ring-2 ring-[#18181B]/10 scale-102 shadow-sm'
                          : 'border-[rgba(232,227,216,0.8)] bg-white hover:border-gray-300'
                      }`}
                    >
                      <div>
                        <span className="block text-xs font-extrabold text-[#18181B]">1x Piece / حبة واحدة</span>
                        <span className="text-[9px] text-[#71717A] font-bold uppercase">Standard Pack</span>
                      </div>
                      <span className="text-sm font-extrabold text-[#18181B] mt-2">{basePrice} DH</span>
                    </button>

                    {/* Double Offer */}
                    <button
                      type="button"
                      onClick={() => setSelectedBundle('double')}
                      className={`rounded-2xl border p-4 text-left spring-transition cursor-pointer flex flex-col justify-between h-28 relative overflow-hidden ${
                        selectedBundle === 'double'
                          ? 'border-[#18181B] bg-[#FAFAF7] ring-2 ring-[#18181B]/10 scale-102 shadow-sm'
                          : 'border-[rgba(232,227,216,0.8)] bg-white hover:border-gray-300'
                      }`}
                    >
                      <span className="absolute top-0 right-0 rounded-bl-xl bg-orange-500 text-white text-[8px] font-extrabold px-2 py-0.5 uppercase tracking-wider">
                        Save 10%
                      </span>
                      <div>
                        <span className="block text-xs font-extrabold text-[#18181B]">2x Pieces / حبتين</span>
                        <span className="text-[9px] text-orange-500 font-extrabold uppercase">Heritage Duo</span>
                      </div>
                      <span className="text-sm font-extrabold text-orange-600 mt-2">
                        {Math.round(basePrice * 0.9)} DH 
                        <span className="text-[9px] text-[#71717A] font-normal block mt-0.5">/each ({Math.round(basePrice * 0.9) * 2} DH total)</span>
                      </span>
                    </button>

                    {/* Medina Triple Offer */}
                    <button
                      type="button"
                      onClick={() => setSelectedBundle('triple')}
                      className={`rounded-2xl border p-4 text-left spring-transition cursor-pointer flex flex-col justify-between h-28 relative overflow-hidden ${
                        selectedBundle === 'triple'
                          ? 'border-[#18181B] bg-[#FAFAF7] ring-2 ring-[#18181B]/10 scale-102 shadow-sm'
                          : 'border-[rgba(232,227,216,0.8)] bg-white hover:border-gray-300'
                      }`}
                    >
                      <span className="absolute top-0 right-0 rounded-bl-xl bg-[#10B981] text-white text-[8px] font-extrabold px-2 py-0.5 uppercase tracking-wider">
                        Save 15%
                      </span>
                      <div>
                        <span className="block text-xs font-extrabold text-[#18181B]">3x Pieces / 3 حبات</span>
                        <span className="text-[9px] text-[#10B981] font-extrabold uppercase">Medina Value</span>
                      </div>
                      <span className="text-sm font-extrabold text-[#10B981] mt-2">
                        {Math.round(basePrice * 0.85)} DH 
                        <span className="text-[9px] text-[#71717A] font-normal block mt-0.5">/each ({Math.round(basePrice * 0.85) * 3} DH total)</span>
                      </span>
                    </button>

                  </div>
                </div>
              )}

              {/* 2. Variants pickers */}
              {Object.keys(variantsGrouped).length > 0 && (
                <div className="space-y-4 border-t border-gray-50 pt-5 select-none">
                  {Object.entries(variantsGrouped).map(([optionName, optionValues]) => {
                    const optionsList = Array.from(new Set(optionValues?.map(v => v.value).filter(Boolean) || [])) as string[];
                    return (
                      <div key={optionName} className="space-y-2">
                        <span className="block text-[10px] font-extrabold text-[#71717A] uppercase tracking-widest">
                          Select {optionName}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {optionsList.map((optionVal, idx) => {
                            const isSelected = selectedVariants[optionName] === optionVal;
                            return (
                              <button
                                key={`${optionVal}-${idx}`}
                                onClick={() => handleVariantSelect(optionName, optionVal)}
                                className={`rounded-xl px-4 py-2 text-xs font-bold spring-transition border cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#18181B] text-white border-[#18181B] shadow-sm'
                                    : 'bg-white hover:bg-[#F5F0E8] text-[#71717A] border-[rgba(232,227,216,0.8)]'
                                }`}
                              >
                                {optionVal}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 3. Action Stepper & Cart triggers */}
              <div className="flex flex-col sm:flex-row gap-4 items-center pt-2 select-none">
                
                {/* Stepper (Quantity buttons - bypassed dynamically if bundle selected) */}
                <div className="flex items-center rounded-xl border border-[rgba(232,227,216,0.8)] bg-[#F5F0E8] p-1 shrink-0">
                  <button
                    onClick={() => {
                      setSelectedBundle('single');
                      setQuantity(prev => Math.max(1, prev - 1));
                    }}
                    disabled={isOutOfStock}
                    className="h-9 w-9 flex items-center justify-center rounded-lg text-[#71717A] hover:text-[#18181B] hover:bg-white transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-10 text-center font-bold text-[#18181B] text-sm">
                    {quantity}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedBundle('single');
                      setQuantity(prev => Math.min(product.stock, prev + 1));
                    }}
                    disabled={isOutOfStock}
                    className="h-9 w-9 flex items-center justify-center rounded-lg text-[#71717A] hover:text-[#18181B] hover:bg-white transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Add-to-cart master action */}
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || addToCartLoading}
                  className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 px-6 text-xs font-bold text-white shadow-md spring-transition cursor-pointer ${
                    addedSuccess
                      ? 'bg-[#10B981]'
                      : 'bg-[#18181B] hover:bg-[#18181B]/90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  {addToCartLoading ? (
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  ) : addedSuccess ? (
                    <>
                      <Check className="h-4 w-4" />
                      Added to Cart!
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="h-4 w-4" />
                      {isOutOfStock 
                        ? 'Sold Out' 
                        : `Place Order • ${totalPrice} DH`
                      }
                    </>
                  )}
                </button>

                {/* Wishlist Bookmark Button */}
                <button
                  onClick={handleWishlistClick}
                  disabled={toggleWishlistLoading}
                  className={`flex h-12 w-12 items-center justify-center rounded-xl border border-[rgba(232,227,216,0.8)] transition-colors shadow-sm cursor-pointer shrink-0 ${
                    favorited ? 'bg-red-50 border-red-200 text-red-500' : 'bg-white text-[#71717A] hover:text-red-500'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${favorited ? 'fill-current' : ''}`} />
                </button>

              </div>

              {/* WhatsApp Inline Button */}
              <div className="pt-2 select-none">
                <WhatsAppButton 
                  context={productContext} 
                  variant="inline" 
                  size="lg" 
                  label="اسأل عن هذا المنتج عبر واتساب" 
                />
              </div>

              {/* Vetted Badges */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[rgba(232,227,216,0.45)] text-[10px] text-[#71717A] font-semibold select-none">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4 text-[#10B981]" /> Medina Authenticity Inspected
                </span>
                <span className="flex items-center gap-1">
                  <Truck className="h-4 w-4 text-[#10B981]" /> Free Medina Express Shipping
                </span>
              </div>

            </div>

            {/* Authentic Master Artisan Bio Card (Emphasizing emotional connection & story) */}
            {product.stores ? (
              <Link 
                href={`/store/${product.stores.slug || product.stores.id}`}
                className="block rounded-3xl border border-warm-border bg-gradient-to-br from-[#FAFAF7] via-white to-white p-5 shadow-sm select-none hover:shadow-md hover:border-[#CA8A04]/40 spring-transition group/artisan cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-2xl overflow-hidden bg-[#F5F0E8] border border-gray-150 shrink-0 group-hover/artisan:scale-105 spring-transition">
                    <img 
                      src={product.stores.logo_url || 'https://images.unsplash.com/photo-1546213290-e1b492ab3eee?w=300'} 
                      alt={product.stores.name} 
                      className="h-full w-full object-cover" 
                    />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-extrabold tracking-widest text-[#18181B] uppercase">Master Artisan Studio</span>
                      <span className="rounded-full bg-[#10B981]/10 px-2 py-0.5 text-[8px] font-bold text-[#10B981] uppercase">Verified Vetting</span>
                    </div>
                    <h5 className="font-extrabold text-xs text-[#18181B] group-hover/artisan:text-[#CA8A04] spring-transition">
                      {product.stores.name}
                    </h5>
                    <p className="text-[10.5px] text-[#71717A] font-light leading-relaxed">
                      &quot;Every piece we craft tells a story of Essaouira Medina. Hand-polished, fair-trade, and made with inherited ancestral methods passed down through generations.&quot;
                    </p>
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#CA8A04] uppercase tracking-widest mt-1 opacity-0 group-hover/artisan:opacity-100 spring-transition">
                      مشاهدة جميع منتجات هذا المتجر ←
                    </span>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50/20 via-white to-white p-5 shadow-sm select-none">
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-2xl overflow-hidden bg-[#F5F0E8] border border-gray-150 shrink-0">
                    <img 
                      src="https://images.unsplash.com/photo-1546213290-e1b492ab3eee?w=300" 
                      alt="Local Workshop" 
                      className="h-full w-full object-cover" 
                    />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-extrabold tracking-widest text-[#18181B] uppercase">Independent Artisan</span>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[8px] font-bold text-amber-700 uppercase">حرفي مستقل</span>
                    </div>
                    <h5 className="font-extrabold text-xs text-[#18181B]">
                      ورشة حرفية محلية
                    </h5>
                    <p className="text-[10.5px] text-[#71717A] font-light leading-relaxed">
                      هذا المنتج تم إضافته من طرف حرفي مستقل. لم يتم ربطه بمتجر بعد.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Details Accordions Drawers */}
            <div className="rounded-3xl border border-[rgba(232,227,216,0.45)] bg-white p-6 shadow-sm">
              <div className="flex border-b border-[rgba(232,227,216,0.45)] pb-0.5 select-none mb-4">
                <button
                  onClick={() => setActiveDrawer('description')}
                  className={`flex items-center gap-1 rounded-xl px-4 py-2 text-xs font-bold spring-transition cursor-pointer ${
                    activeDrawer === 'description'
                      ? 'bg-[#18181B] text-white shadow-sm'
                      : 'text-[#71717A] hover:text-gray-900'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" /> Story & Care
                </button>
                <button
                  onClick={() => setActiveDrawer('shipping')}
                  className={`flex items-center gap-1 rounded-xl px-4 py-2 text-xs font-bold spring-transition cursor-pointer ${
                    activeDrawer === 'shipping'
                      ? 'bg-[#18181B] text-white shadow-sm'
                      : 'text-[#71717A] hover:text-gray-900'
                  }`}
                >
                  <Truck className="h-3.5 w-3.5" /> Shipping & Delivery
                </button>
              </div>

              {activeDrawer === 'description' ? (
                <div 
                  className="prose prose-sm max-w-none" 
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(product.description || 'No description listed.') }}
                />
              ) : (
                <div className="space-y-2 text-xs text-[#71717A] leading-relaxed">
                  <h4 className="font-bold text-gray-900 uppercase tracking-widest text-[10px] mb-1">Local and Global Dispatch</h4>
                  <p>
                    All items are direct from individual artisan workshops in the Essaouira Medina. Woodcraft and oils are carefully bubble-wrapped to protect high-gloss shellacs and cosmetic glass containers.
                  </p>
                  <ul className="list-disc pl-4 space-y-1 mt-2">
                    <li>Essaouira Local Delivery: 24 Hours (Free)</li>
                    <li>Morocco National Delivery (Amana): 2-4 Business Days</li>
                    <li>Global DHL Shipping: 5-8 Business Days</li>
                  </ul>
                </div>
              )}
            </div>

            {/* 5. Rating Breakdown Graph & compose wizard */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch select-none">
              <RatingBreakdown
                distribution={distribution}
                totalCount={totalReviewsCount}
                starFilter={starFilter}
                onStarFilterChange={setStarFilter}
              />

              <div className="rounded-2xl bg-white border border-[rgba(232,227,216,0.45)] p-5 shadow-sm flex flex-col justify-between items-start">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-[#18181B] mb-1">
                    Share Your Feedback
                  </h4>
                  <p className="text-xs leading-relaxed text-[#71717A] font-light">
                    {myReview
                      ? 'You have already submitted a review for this mastercraft item. You can modify or delete your rating at any time.'
                      : 'Have you purchased or experienced this product? Submit your verified score and help others shop in trust.'}
                  </p>
                </div>

                <button
                  onClick={() => setIsWritePanelOpen(!isWritePanelOpen)}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#18181B] px-5 py-3 text-xs font-bold text-white hover:bg-[#18181B] spring-transition shadow-sm cursor-pointer"
                >
                  <MessageSquarePlus className="h-4 w-4" />
                  {isWritePanelOpen ? 'Close Review Form' : 'Write a Visual Review'}
                </button>
              </div>
            </div>

            {/* Inline Drag-and-Drop Media Review Submission Panel */}
            {isWritePanelOpen && (
              <form 
                onSubmit={handleSubmitLocalReview}
                className="mt-6 rounded-3xl border border-[#18181B]/20 bg-[#FAFAF7]/50 p-6 space-y-5 animate-in slide-in-from-top duration-300 select-none"
              >
                <div className="flex items-center justify-between border-b border-[rgba(232,227,216,0.45)] pb-3">
                  <h4 className="font-extrabold text-sm text-[#18181B] flex items-center gap-1.5" >
                    <Camera className="h-4 w-4 text-[#18181B]" /> Submit Visual Media Review / إضافة تقييم مصور
                  </h4>
                  <button 
                    type="button" 
                    onClick={() => setIsWritePanelOpen(false)}
                    className="h-7 w-7 rounded-lg hover:bg-[#E8E3D8] flex items-center justify-center text-[#71717A] cursor-pointer animate-pulse"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Score Selector */}
                <div className="space-y-2">
                  <span className="block text-[10px] font-extrabold text-[#71717A] uppercase tracking-widest">
                    Your Rating / تقييمك بالنجوم
                  </span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="p-1 cursor-pointer transition-transform hover:scale-110 text-amber-400"
                      >
                        <Star className={`h-6 w-6 ${reviewRating >= star ? 'fill-current' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Review Text */}
                <div className="space-y-2">
                  <span className="block text-[10px] font-extrabold text-[#71717A] uppercase tracking-widest">
                    Review Text / نص التقييم
                  </span>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="اكتب تجربتك مع هذا المنتج الحرفي هنا..."
                    rows={4}
                    className="w-full bg-white border border-[rgba(232,227,216,0.8)] focus:border-[#18181B] focus:ring-1 focus:ring-[#18181B] rounded-2xl p-4 text-xs outline-none spring-transition"
                    style={{ direction: 'rtl' }}
                    required
                  />
                </div>

                {/* Media drag-and-drop dropzone */}
                <div className="space-y-2">
                  <span className="block text-[10px] font-extrabold text-[#71717A] uppercase tracking-widest">
                    Upload Photos or Video Loops / ارفع صوراً أو فيديوهات قصيرة
                  </span>
                  
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors ${
                      isDragActive 
                        ? 'border-[#18181B] bg-[#FAFAF7]' 
                        : 'border-[rgba(232,227,216,0.8)] bg-white hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="file"
                      id="review-file-upload"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    
                    <label 
                      htmlFor="review-file-upload"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <UploadCloud className="h-8 w-8 text-[#18181B] animate-bounce" />
                      <div>
                        <span className="text-xs font-bold text-gray-700 block">
                          Drag and drop files here, or <span className="text-[#18181B]">browse</span>
                        </span>
                        <span className="text-[10px] text-[#71717A] font-light block mt-0.5">
                          Support high-fidelity images and looping video MP4 reviews
                        </span>
                      </div>
                    </label>
                  </div>

                  {/* Uploaded Files Previews Grid */}
                  {uploadedMedia.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 pt-3">
                      {uploadedMedia.map((media, idx) => (
                        <div key={idx} className="relative aspect-square rounded-xl border border-[rgba(232,227,216,0.8)] bg-[#F5F0E8] overflow-hidden group">
                          {media.type === 'video' ? (
                            <div className="h-full w-full flex items-center justify-center text-[#18181B] bg-[#FAFAF7]">
                              <FileVideo className="h-6 w-6" />
                              <span className="text-[8px] font-extrabold absolute bottom-1 uppercase bg-[#18181B] text-white px-1.5 py-0.5 rounded">
                                Video Loop
                              </span>
                            </div>
                          ) : (
                            <img src={media.url} alt="Upload preview" className="h-full w-full object-cover" />
                          )}
                          
                          <button
                            type="button"
                            onClick={() => handleRemoveMedia(idx)}
                            className="absolute -top-1 -right-1 h-5 w-5 bg-rose-500 hover:bg-rose-600 rounded-full flex items-center justify-center text-white shadow-md cursor-pointer transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsWritePanelOpen(false)}
                    className="rounded-xl border border-gray-250 hover:bg-[#F5F0E8] px-4 py-2.5 text-xs font-bold text-[#71717A] cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#18181B] hover:bg-[#18181B] px-5 py-2.5 text-xs font-bold text-white cursor-pointer shadow-md spring-transition"
                  >
                    Submit Verified Review ✨
                  </button>
                </div>
              </form>
            )}

            {/* 📸 CUSTOMER PHOTO & VIDEO GALLERY MASONRY GRID */}
            {localReviews.flatMap(r => (r.media || []).map((m: any) => ({ ...m, userName: r.userName, rating: r.rating, text: r.text }))).length > 0 && (
              <div className="space-y-3 pt-6 select-none border-t border-[rgba(232,227,216,0.45)] mt-6">
                <span className="block text-[10px] font-extrabold text-[#71717A] uppercase tracking-widest flex items-center gap-1">
                  <Camera className="h-3.5 w-3.5 text-[#18181B]" /> Customer Video & Photo Gallery / معرض المشتريين المصور
                </span>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {localReviews.flatMap(r => (r.media || []).map((m: any) => ({ ...m, userName: r.userName, rating: r.rating, text: r.text }))).map((item, idx) => (
                    <div 
                      key={idx}
                      onClick={() => setLightboxItem(item)}
                      className="group relative aspect-[3/4] rounded-2xl border border-gray-150 bg-[#F5F0E8] overflow-hidden shadow-sm hover:shadow-md cursor-pointer spring-transition"
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-[#18181B]/70 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-80 z-10" />
                      
                      {item.type === 'video' ? (
                        <>
                          <video
                            src={item.url}
                            autoPlay
                            muted
                            loop
                            playsInline
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                          <div className="absolute top-3 right-3 h-7 w-7 rounded-full bg-white/25 backdrop-blur-md border border-white/20 flex items-center justify-center text-white z-20 group-hover:scale-110 transition-transform">
                            <Play className="h-3.5 w-3.5 fill-current" />
                          </div>
                        </>
                      ) : (
                        <img 
                          src={item.url} 
                          alt="Customer showcase" 
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      )}

                      {/* Small overlay info banner inside card */}
                      <div className="absolute bottom-3 left-3 right-3 z-20 text-white space-y-0.5">
                        <span className="text-[10px] font-extrabold block truncate">
                          Verified by {item.userName}
                        </span>
                        <div className="flex gap-0.5 text-amber-400">
                          {Array.from({ length: item.rating }).map((_, i) => (
                            <Star key={i} className="h-2.5 w-2.5 fill-current" />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. Review Feed Cards Grid */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-150 pb-4 select-none">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-xl text-[#18181B]" >
                    Customer Reviews
                  </h3>
                  {starFilter !== null && (
                    <span className="inline-flex items-center rounded-lg bg-[#F5F0E8] border border-gray-250 px-2.5 py-0.5 text-[9px] font-bold text-[#71717A]">
                      ★ {starFilter} Filtered
                    </span>
                  )}
                </div>

                {/* Sorter Selector */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#71717A]">Sort by:</span>
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="appearance-none rounded-xl border border-gray-250 bg-white pl-3.5 pr-8 py-2 text-xs font-bold text-[#18181B] focus:outline-none focus:ring-1 focus:ring-[#18181B] cursor-pointer"
                    >
                      <option value="recent">Most Recent</option>
                      <option value="helpful">Most Helpful</option>
                      <option value="highest">Highest Rated</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 pointer-events-none text-[#71717A]" />
                  </div>
                </div>
              </div>

              {/* Loader */}
              {isReviewsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-[#18181B]" />
                </div>
              ) : (() => {
                const allRevs = [...localReviews, ...reviews];
                const filtered = allRevs.filter(r => {
                  if (starFilter !== null && r.rating !== starFilter) return false;
                  return true;
                });
                const sorted = [...filtered].sort((a, b) => {
                  if (sortBy === 'highest') return b.rating - a.rating;
                  return new Date(b.timestamp || b.created_at).getTime() - new Date(a.timestamp || a.created_at).getTime();
                });

                if (sorted.length === 0) {
                  return (
                    <div className="rounded-2xl border border-dashed border-[rgba(232,227,216,0.8)] p-12 text-center bg-white select-none">
                      <MessageSquarePlus className="mx-auto h-8 w-8 text-gray-200 mb-3" />
                      <p className="text-xs font-bold text-[#18181B]">No reviews yet / لا توجد تقييمات بعد</p>
                      <p className="text-[10px] text-[#71717A] font-light mt-0.5">
                        {starFilter !== null
                          ? 'No reviews match your selected star rating filter.'
                          : 'Be the first to share your experience by writing a review.'}
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {sorted.map((review) => (
                      <div key={review.id} className="space-y-2 bg-white rounded-3xl border border-[rgba(232,227,216,0.45)] p-6 shadow-sm">
                        {/* Custom visual-friendly review card wrapper */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-[#FAFAF7] border border-warm-border flex items-center justify-center text-xs font-bold text-[#18181B] uppercase">
                              {review.userName ? review.userName.substring(0, 2) : 'UR'}
                            </div>
                            <div>
                              <h5 className="font-extrabold text-xs text-[#18181B]">{review.userName || 'Anonymous'}</h5>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <div className="flex gap-0.5 text-amber-400">
                                  {Array.from({ length: review.rating }).map((_, i) => (
                                    <Star key={i} className="h-2.5 w-2.5 fill-current" />
                                  ))}
                                </div>
                                <span className="text-[9px] text-[#71717A] font-medium">
                                  {review.timestamp ? new Date(review.timestamp).toLocaleDateString() : 'Verified Purchase'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* If review is local, let them delete it */}
                          {review.id.toString().startsWith('local-rev-') && (
                            <button
                              onClick={() => {
                                const updated = localReviews.filter(r => r.id !== review.id);
                                setLocalReviews(updated);
                                localStorage.setItem(`mogador_media_reviews_${id}`, JSON.stringify(updated));
                              }}
                              className="text-[#71717A] hover:text-red-500 p-1 cursor-pointer transition-colors"
                              title="Delete local review"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        <p className="text-xs text-[#71717A] font-light mt-3 leading-relaxed" style={{ direction: 'rtl' }}>
                          {review.text}
                        </p>

                        {/* Visual Media Attachment Previews */}
                        {review.media && review.media.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-3">
                            {review.media.map((med: any, mIdx: number) => (
                              <div
                                key={mIdx}
                                onClick={() => setLightboxItem(med)}
                                className="relative h-16 w-16 rounded-xl overflow-hidden border border-gray-150 cursor-pointer hover:scale-105 transition-transform"
                              >
                                {med.type === 'video' ? (
                                  <>
                                    <video src={med.url} muted className="h-full w-full object-cover" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white">
                                      <Play className="h-4 w-4 fill-current text-white/90" />
                                    </div>
                                  </>
                                ) : (
                                  <img src={med.url} alt="Review attachment" className="h-full w-full object-cover" />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

          </div>

        </div>
      </main>

      {/* Review composer dialog modal */}
      <ReviewModal
        product={product}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        existingReview={myReview ?? null}
      />

      {/* Delete confirmation dialog modal */}
      {deleteConfirmReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18181B]/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white border border-[rgba(232,227,216,0.45)] p-6 shadow-2xl animate-scale-up text-center select-none" >
            <Trash2 className="mx-auto h-10 w-10 text-red-500 mb-4" />
            <h4 className="font-bold text-lg text-[#18181B]" >Delete review?</h4>
            <p className="mt-2 text-xs leading-relaxed text-[#71717A] font-light">
              Are you sure you want to permanently delete your review? This action is irreversible.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteConfirmReview(null)}
                className="rounded-xl border border-[rgba(232,227,216,0.8)] px-4 py-2 text-xs font-bold text-[#71717A] hover:bg-[#F5F0E8] spring-transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteReview}
                disabled={deleteMutation.isPending}
                className="rounded-xl bg-red-500 px-5 py-2 text-xs font-bold text-white hover:bg-red-600 spring-transition disabled:opacity-50 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🎬 FULL SCREEN MEDIA LIGHTBOX MODAL */}
      {lightboxItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18181B]/90 backdrop-blur-md animate-fade-in select-none">
          <button 
            type="button"
            onClick={() => setLightboxItem(null)}
            className="absolute top-4 right-4 h-12 w-12 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="w-full max-w-2xl bg-black border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col md:flex-row items-stretch min-h-[400px]">
            
            {/* Left Media Area */}
            <div className="flex-1 bg-black flex items-center justify-center relative min-h-[300px]">
              {lightboxItem.type === 'video' ? (
                <div className="w-full h-full relative flex items-center justify-center">
                  <video
                    src={lightboxItem.url}
                    autoPlay
                    loop
                    muted={isMuted}
                    playsInline
                    className="w-full h-full object-contain aspect-square max-h-[500px]"
                  />
                  {/* Volume Control */}
                  <button
                    type="button"
                    onClick={() => setIsMuted(!isMuted)}
                    className="absolute bottom-4 right-4 h-10 w-10 rounded-xl bg-[#18181B]/60 backdrop-blur-md hover:bg-black/80 backdrop-blur-sm border border-white/10 text-white flex items-center justify-center cursor-pointer transition-colors z-20"
                  >
                    {isMuted ? <VolumeX className="h-4.5 w-4.5" /> : <Volume2 className="h-4.5 w-4.5" />}
                  </button>
                </div>
              ) : (
                <img 
                  src={lightboxItem.url} 
                  alt="Lightbox view" 
                  className="w-full h-full object-contain aspect-square max-h-[500px]"
                />
              )}
            </div>

            {/* Right Information Area */}
            <div className="w-full md:w-[260px] bg-[#18181B] text-white p-6 flex flex-col justify-between border-t md:border-t-0 md:border-l border-white/10">
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-400">
                    {Array.from({ length: lightboxItem.rating || 5 }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-current" />
                    ))}
                  </div>
                  <span className="text-[10px] font-extrabold text-[#71717A] uppercase tracking-widest block">
                    Verified Buyer Review
                  </span>
                  <h4 className="text-sm font-bold truncate">{lightboxItem.userName || 'Anonymous'}</h4>
                </div>
                
                <p className="text-xs text-gray-300 font-light leading-relaxed max-h-[220px] overflow-y-auto" style={{ direction: 'rtl' }}>
                  {lightboxItem.text}
                </p>
              </div>

              <div className="border-t border-white/5 pt-4 mt-6 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#10B981]" />
                <span className="text-[8.5px] font-extrabold text-[#71717A] uppercase tracking-widest">
                  Mogador Verified Purchase
                </span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Floating WhatsApp Button */}
      {showFloating && (
        <WhatsAppButton context={productContext} variant="floating" />
      )}

    </div>
  );
}
