'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Heart, ShoppingBag, Loader2, Check, ShoppingCart } from 'lucide-react';
import StarRating from './StarRating';
import { Product } from '@/types';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import WhatsAppButton from './ui/whatsapp-button';
import { ProductContext } from '@/lib/whatsapp/types';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist, toggleWishlistLoading } = useWishlist();
  
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const favorited = isInWishlist(product.id);
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 3;

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

  // Calculate discount percentage
  const discountPercent = product.compare_price && product.compare_price > product.price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : null;

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    await toggleWishlist(product.id);
  };

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    
    // If product has variants, redirect to product details page instead of adding instantly
    // We fetch a dummy products detail check or since we want 100% security,
    // if the product has variants in typical setup, detail page handles option picking
    // Let's check: if we know it might have variants, or as a standard safety, 
    // we check if it is surf or wetsuits or chess. Or since this is quick add,
    // we can add it to cart directly or redirect if they need to configure options.
    // Let's redirect to detail page for custom variants, or if it is simple wood/soap, add instantly!
    // category is now a joined object { id, name, slug } per migration 013
    const catName = (product as any).category?.name || '';
    const requiresVariants = catName.toLowerCase().includes('surf') || product.name.includes('Elixir') || product.name.includes('Chess');
    
    if (requiresVariants) {
      router.push(`/product/${product.id}`);
      return;
    }

    try {
      setAddingToCart(true);
      await addToCart({ productId: product.id, quantity: 1, variant: null });
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to add to cart:', err);
    } finally {
      setAddingToCart(false);
    }
  };

  // Resolve cover image from array or string fallbacks
  const coverImage = product.images && product.images.length > 0
    ? product.images[0]
    : (product as any).image_url || '/placeholder.jpg';

  // Resolve hover view secondary image
  const hoverImage = product.images && product.images.length > 1
    ? product.images[1]
    : coverImage;

  const mockRating = product.avg_rating ? product.avg_rating.toFixed(1) : '4.5';
  const soldCount = product.price > 400 ? '1,200+ sold' : '15,000+ sold';
  const saveAmount = Math.round(Number(product.price) * 0.18);

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-[20px] bg-white border border-warm-border hover:border-gray-300 transition-all duration-300 hover:shadow-md h-[340px] select-none font-sans" style={{ fontFamily: 'var(--font-sans), sans-serif' }}>
      
      {/* 55% Height Image Frame */}
      <div className="relative h-[55%] w-full overflow-hidden bg-[#FAFAF7] select-none">
        
        {/* Wishlist Button Overlay */}
        <button
          onClick={handleWishlistClick}
          disabled={toggleWishlistLoading}
          className="absolute top-2 right-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-md shadow-sm text-gray-500 hover:text-red-500 hover:bg-white transition-all active-push cursor-pointer border border-gray-150"
        >
          <Heart className={`h-4 w-4 transition-transform group-hover:scale-105 ${favorited ? 'fill-red-500 text-red-500' : ''}`} />
        </button>

        {/* Product Image Zoom with Single Image Swap */}
        <Link href={`/product/${product.id}`} className="block h-full w-full relative overflow-hidden">
          <img
            src={coverImage}
            alt={product.name}
            className="absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out group-hover:scale-105 will-change-transform"
            loading="lazy"
          />
        </Link>

        {/* Out Of Stock Overlay Mask */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-[#1C1917]/60 flex items-center justify-center z-10 select-none backdrop-blur-[1px]">
            <span className="rounded-lg bg-white px-3 py-1.5 text-[10px] font-black text-[#1C1917] uppercase tracking-wider shadow-sm border border-gray-100">
              Sold Out
            </span>
          </div>
        )}

        {/* Quick Add Shopping Cart Button Overlay (AliExpress Style) */}
        {!isOutOfStock && (
          <button
            onClick={handleQuickAdd}
            disabled={addingToCart}
            className="absolute bottom-8 right-2.5 z-20 flex h-7.5 w-7.5 items-center justify-center rounded-full bg-white hover:bg-[#FAFAF7] border border-gray-200 text-[#1C1917] shadow-sm hover:shadow active-push cursor-pointer transition-all z-20"
          >
            {addingToCart ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : addedSuccess ? (
              <Check className="h-3.5 w-3.5 text-green-600" />
            ) : (
              <ShoppingCart className="h-3.5 w-3.5 text-[#1C1917]" />
            )}
          </button>
        )}

        {/* Solid pink/red Welcome Deal banner at the bottom of the image frame */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-r from-pink-500 to-red-500 text-white text-[8.5px] font-black uppercase text-center py-1 select-none z-10">
          WELCOME DEAL • Free shipping
        </div>
      </div>

      {/* 45% Description details area */}
      <div className="flex h-[45%] flex-col justify-between p-3 bg-white border-t border-warm-border/50">
        <div className="space-y-1">
          
          {/* Title with inline 'Choice' badge */}
          <Link href={`/product/${product.id}`} className="block group/link">
            <div className="text-[11px] leading-tight text-[#44403C] line-clamp-2 mt-0.5 group-hover/link:text-[#CA8A04] transition-colors">
              <span className="inline-block bg-[#FFF5C2] text-[#78350F] border border-[#FDE68A] text-[8px] font-black px-1.5 py-0.5 rounded mr-1 select-none tracking-wider uppercase">
                Choice
              </span>
              {product.name}
            </div>
          </Link>

          {/* Pricing block in RED */}
          <div className="flex items-baseline flex-wrap gap-1.5 pt-0.5">
            <span className="text-sm font-black text-red-500 font-display">
              MAD {product.price}
            </span>
            {product.compare_price && product.compare_price > product.price && (
              <>
                <span className="text-[9px] text-gray-400 line-through">
                  MAD {product.compare_price}
                </span>
                <span className="text-[9px] text-red-500 font-black">
                  -{discountPercent}%
                </span>
              </>
            )}
          </div>

          {/* Star Rating and sold count */}
          <div className="flex items-center gap-1.5 text-[9.5px] text-gray-550 font-semibold select-none">
            <span className="text-[#CA8A04]">★</span>
            <span>{mockRating}</span>
            <span className="text-gray-250">|</span>
            <span>{soldCount}</span>
          </div>

        </div>

        {/* AliExpress Social proof & red dot tags */}
        <div className="border-t border-warm-border/40 pt-1.5 mt-1 space-y-0.5">
          <span className="text-[9px] text-orange-500 font-bold block">
            ⚡ New shoppers save MAD {saveAmount}
          </span>
          <div className="flex items-center gap-1 text-[9px] text-red-500 font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 inline-block animate-pulse" />
            <span>{product.price > 200 ? 'Best price in similar deals' : 'Top selling on Mogador'}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
