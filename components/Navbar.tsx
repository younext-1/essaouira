'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { UserButton, useUser, SignInButton } from '@clerk/nextjs';
import { Search, Heart, ShoppingBag, Store, Menu, X, Compass, ChevronDown, Package } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useProfile } from '@/hooks/useProfile';
import SearchOverlay from './SearchOverlay';

interface NavbarProps {
  onSearch?: (term: string) => void;
}

export default function Navbar({ onSearch }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isSignedIn, isLoaded } = useUser();
  const { profile } = useProfile(user?.id);
  const { cartItemsCount } = useCart();
  const { wishlist } = useWishlist();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);

  // Hide global Navbar inside Seller/Artisan dashboard and Auth portals
  if (
    pathname?.startsWith('/dashboard') || 
    pathname?.startsWith('/sign-in') || 
    pathname?.startsWith('/sign-up')
  ) {
    return null;
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchTerm);
    } else {
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const categories = [
    'Artisanal Wood',
    'Cosmetics & Oils',
    'Surf Gear',
    'Leather Goods',
    'Moroccan Rugs',
    'Pottery & Ceramic',
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#FAFAF7] border-b border-warm-border select-none font-sans" style={{ fontFamily: 'var(--font-sans), sans-serif' }}>
      
      {/* 1. Primary Header Row (AliExpress Top Bar Style) */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-20 items-center justify-between gap-4 md:gap-8">
          
          {/* Logo Brand Header */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="flex flex-col">
              <span className="font-serif text-xl sm:text-2xl font-black tracking-tight text-[#1C1917]" style={{ fontFamily: 'var(--font-display), serif' }}>
                MOGADOR
              </span>
              <span className="text-[7px] sm:text-[8px] font-extrabold tracking-widest text-[#CA8A04] uppercase">
                Choice Marketplace
              </span>
            </div>
          </Link>

          {/* Long High-Conversion Search Box (AliExpress Input Style) */}
          <div 
            onClick={() => setSearchOverlayOpen(true)}
            className="flex-1 max-w-2xl relative cursor-pointer group/search"
          >
            <div className="w-full h-10 sm:h-11 rounded-full border-2 border-[#1C1917] bg-white pl-4 pr-12 flex items-center text-xs text-gray-400 font-semibold select-none shadow-sm hover:border-[#CA8A04] transition-all">
              Search premium crafts, Thuya, Argan, Boutiques...
            </div>
            {/* Search Capsule Button */}
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 sm:h-8 px-4 rounded-full bg-[#1C1917] text-white flex items-center justify-center hover:bg-[#CA8A04] transition-colors">
              <Search className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Desktop Right Utilities (EN/MAD, Account, Wishlist, Cart) */}
          <div className="hidden md:flex items-center gap-6 text-xs font-bold text-[#44403C] shrink-0">
            
            {/* Country/Currency Selector */}
            <div className="flex items-center gap-1 cursor-pointer hover:text-[#CA8A04] transition-colors">
              <span className="text-base leading-none">🇲🇦</span>
              <span className="text-[11px] uppercase tracking-wider">EN/MAD</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </div>

            {/* Account / User Portal */}
            {isLoaded && isSignedIn ? (
              <div className="flex items-center gap-2">
                <div className="flex flex-col text-right">
                  <span className="text-[9px] font-light text-gray-450">Welcome back</span>
                  <span className="text-[11px] font-extrabold text-[#1C1917] truncate max-w-[100px]">{profile?.full_name || user?.fullName || 'Artisan'}</span>
                </div>
                <UserButton />
              </div>
            ) : (
              <SignInButton mode="modal">
                <div className="flex flex-col cursor-pointer text-left hover:text-[#CA8A04] transition-colors">
                  <span className="text-[9px] font-light text-gray-450">Welcome</span>
                  <span className="text-[11px] font-extrabold text-[#1C1917]">Sign In / Register</span>
                </div>
              </SignInButton>
            )}

            {/* Wishlist Heart */}
            <Link
              href="/profile?tab=wishlist"
              className="relative p-1.5 text-[#44403C] hover:text-[#CA8A04] transition-colors"
            >
              <Heart className="h-5 w-5" />
              {wishlist.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#CA8A04] text-[8px] font-bold text-white shadow-sm ring-2 ring-white">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Cart Icon */}
            <Link
              href="/cart"
              className="relative p-1.5 text-[#44403C] hover:text-[#CA8A04] transition-colors"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#1C1917] text-[8px] font-bold text-white shadow-sm ring-2 ring-white">
                  {cartItemsCount}
                </span>
              )}
            </Link>

            {/* Dashboard / Sell CTA */}
            {isLoaded && isSignedIn && (
              <Link
                href={profile?.is_artisan ? '/dashboard' : '/dashboard/store'}
                className="rounded-xl bg-[#1C1917] hover:bg-[#CA8A04] px-4.5 py-2.5 text-xs font-bold text-white transition-all shadow-sm active-push"
              >
                {profile?.is_artisan ? 'Seller Dashboard' : 'Open Store'}
              </Link>
            )}
          </div>

          {/* Mobile responsive toggle action triggers */}
          <div className="flex md:hidden items-center gap-3">
            <Link href="/cart" className="relative p-1.5 text-[#1C1917]">
              <ShoppingBag className="h-5.5 w-5.5" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#CA8A04] text-[8px] font-bold text-white">
                  {cartItemsCount}
                </span>
              )}
            </Link>
            {isLoaded && isSignedIn && (
              <UserButton />
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-warm-border bg-white text-[#1C1917] hover:bg-gray-50 cursor-pointer active-push"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* 2. Secondary Sub-Header Categories Row (AliExpress Links Bar Style) */}
      <div className="border-t border-warm-border/50 bg-[#FAFAF7] hidden md:block">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between text-xs font-semibold text-[#44403C]">
          
          <div className="flex items-center gap-6">
            
            {/* All Categories dropdown */}
            <div className="relative">
              <button
                onClick={() => setCategoriesOpen(!categoriesOpen)}
                className="flex items-center gap-2 rounded-full border border-warm-border bg-white px-4 py-2 hover:border-gray-300 transition-all font-bold cursor-pointer"
              >
                <Menu className="h-3.5 w-3.5" />
                All Categories
                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>

              {categoriesOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setCategoriesOpen(false)} />
                  <div className="absolute left-0 mt-2 w-56 rounded-2xl border border-warm-border bg-white p-2.5 shadow-xl z-20 animate-in fade-in slide-in-from-top-2 duration-300">
                    {categories.map((cat) => (
                      <Link
                        key={cat}
                        href={`/category/${encodeURIComponent(cat)}`}
                        onClick={() => setCategoriesOpen(false)}
                        className="block rounded-xl px-3 py-2 text-xs font-semibold text-[#44403C] hover:bg-[#CA8A04]/10 hover:text-[#CA8A04] transition-colors"
                      >
                        {cat}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Hot Category Tags */}
            <nav className="flex items-center gap-6">
              <Link href="/search" className="text-red-500 font-extrabold hover:text-red-600 relative">
                Bundle deals
                <span className="absolute -top-2.5 -right-3.5 rounded-full bg-red-500 text-white text-[7px] font-black px-1.5 py-0.5 uppercase scale-85">Hot</span>
              </Link>
              <Link href="/search" className="hover:text-[#CA8A04] transition-colors">Choice</Link>
              <Link href="/search" className="hover:text-[#CA8A04] transition-colors">SuperDeals</Link>
              <Link href="/search" className="hover:text-[#CA8A04] transition-colors">Medina Crafts</Link>
              <Link href="/search" className="hover:text-[#CA8A04] transition-colors">Thuya Cedar</Link>
              <Link href="/search" className="hover:text-[#CA8A04] transition-colors">Cosmetic Oils</Link>
              <Link href="/orders" className="hover:text-[#CA8A04] transition-colors">My Orders</Link>
            </nav>

          </div>

          <div className="flex items-center gap-4 text-xs font-bold text-gray-500">
            <span>Free delivery on Choice items!</span>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-warm-border bg-[#FAFAF7]/95 backdrop-blur-xl px-4 py-5 animate-in fade-in slide-in-from-top-2 duration-200" style={{ fontFamily: 'Outfit, sans-serif' }}>
          <div className="space-y-4">
            <div 
              onClick={() => {
                setMobileMenuOpen(false);
                setSearchOverlayOpen(true);
              }}
              className="relative w-full cursor-pointer"
            >
              <div className="w-full rounded-xl border border-warm-border bg-white py-2.5 pl-11 pr-5 text-xs text-gray-400 font-semibold select-none flex items-center">
                Search premium products...
              </div>
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>

            <div className="flex flex-col gap-3 font-semibold text-xs text-[#44403C]">
              <Link 
                href="/search" 
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 border-b border-warm-border/50 hover:text-[#1C1917] text-red-500 font-bold"
              >
                Bundle Deals 🔥
              </Link>
              <Link 
                href="/search" 
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 border-b border-warm-border/50 hover:text-[#1C1917]"
              >
                SuperDeals ⚡
              </Link>
              <Link 
                href="/search" 
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 border-b border-warm-border/50 hover:text-[#1C1917]"
              >
                Explore Catalog
              </Link>

              <div className="py-2 border-b border-warm-border/50">
                <span className="block font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-2">Categories</span>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((cat) => (
                    <Link
                      key={cat}
                      href={`/category/${encodeURIComponent(cat)}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-xs text-[#44403C] hover:text-[#CA8A04]"
                    >
                      {cat.replace(' & Tapestries', '').replace(' Carvings', '').replace(' & Cosmetics', '')}
                    </Link>
                  ))}
                </div>
              </div>
              
              {isLoaded && isSignedIn && (
                <>
                  <Link 
                    href="/profile" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2 border-b border-warm-border/50 hover:text-[#1C1917]"
                  >
                    My Profile Settings
                  </Link>

                  <Link 
                    href="/orders" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2 border-b border-warm-border/50 hover:text-[#1C1917]"
                  >
                    Track Orders
                  </Link>

                  <Link 
                    href={profile?.is_artisan ? '/dashboard' : '/dashboard/store'}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-3 rounded-xl bg-[#1C1917] text-center font-bold text-white hover:bg-[#CA8A04] transition-all"
                  >
                    {profile?.is_artisan ? 'Seller Dashboard' : 'Open Artisan Shop'}
                  </Link>
                </>
              )}

              {isLoaded && !isSignedIn && (
                <SignInButton mode="modal">
                  <button className="block w-full text-center rounded-xl bg-[#1C1917] py-3 text-xs font-bold text-white hover:bg-[#CA8A04] cursor-pointer">
                    Sign In
                  </button>
                </SignInButton>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Premium Search & Discovery Overlay */}
      <SearchOverlay 
        isOpen={searchOverlayOpen} 
        onClose={() => setSearchOverlayOpen(false)} 
      />
    </header>
  );
}
