'use client';

import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { UserButton, useUser, SignInButton } from '@clerk/nextjs';
import { Search, Heart, ShoppingBag, Store, Menu, X, Compass, ChevronDown, Package } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useProfile } from '@/hooks/useProfile';
import SearchOverlay from './SearchOverlay';
import CartDrawer from './CartDrawer';
import CameraSearchModal from './CameraSearchModal';
import NotificationPopover from './NotificationPopover';

interface NavbarProps {
  onSearch?: (term: string) => void;
}

export default function Navbar({ onSearch }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isSignedIn, isLoaded } = useUser();
  const { profile } = useProfile(user?.id);
  const { cartItemsCount } = useCart();
  const { wishlist } = useWishlist();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [cameraSearchOpen, setCameraSearchOpen] = useState(false);
  
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'store' as const,
      title: 'تسجيل بائع جديد ⛺',
      body: 'قام الحرفي المتميز "Atlas Botanicals" بافتتاح متجره لعرض زيوت الأركان العضوية!',
      timeText: 'منذ دقيقة',
      link: '/search?category=Oils%20%26%20Cosmetics',
      unread: true,
    },
    {
      id: 2,
      type: 'promo' as const,
      title: 'خصم شحن مجاني ⚡',
      body: 'احصل على شحن مجاني آمن لكافة مشترياتك من الصناعات التقليدية برمز كود: MOGADOR',
      timeText: 'منذ ساعة',
      link: '/search',
      unread: true,
    },
    {
      id: 3,
      type: 'system' as const,
      title: 'نظام الدفع العادل 🔒',
      body: 'تم سداد المستحقات بالكامل لورشة المعلم عبد الجليل للصناعات الخشبية بنجاح.',
      timeText: 'منذ ساعتين',
      link: '/profile',
      unread: false,
    }
  ]);

  const handleMarkAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const hasUnreadNotifications = notifications.some(n => n.unread);

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
      
      {/* ========================================================
          MOBILE-ONLY HEADER BLOCK (ALIEXPRESS APP STYLE) 
          ======================================================== */}
      <div className="md:hidden w-full bg-[#FAFAF7] px-4 pt-3.5 pb-2.5 flex flex-col gap-3 select-none">
        
        {/* Row 1: AliExpress Bold Logo Branding & Notification bell */}
        <div className="flex items-center justify-between w-full">
          <Link href="/" className="flex items-center gap-1.5 active:opacity-90">
            <span className="font-sans font-black text-xl tracking-tight text-[#1C1917]">
              MOGADOR
              <span className="text-[#E61E42] font-serif italic font-extrabold ml-1.5 text-[13px] tracking-wide bg-[#FFEBEF] px-1.5 py-0.5 rounded-md">
                Choice
              </span>
            </span>
          </Link>
          
          <div className="flex items-center gap-3 text-[#1C1917]">
            {/* Dashboard / Sell CTA for Mobile */}
            {isLoaded && isSignedIn && (
              <Link 
                href={profile?.is_artisan ? '/dashboard' : '/dashboard/store'} 
                className="flex items-center gap-1.5 bg-[#1C1917] text-white px-3 py-1.5 rounded-full text-[9px] font-black uppercase active-push border border-gray-800 shadow-sm shrink-0 font-sans"
              >
                <svg viewBox="0 0 24 24" className="w-3 h-3 fill-none stroke-current stroke-[2.5]" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="3" width="7" height="9" />
                  <rect x="14" y="3" width="7" height="5" />
                  <rect x="14" y="12" width="7" height="9" />
                  <rect x="3" y="16" width="7" height="5" />
                </svg>
                <span>Dashboard</span>
              </Link>
            )}

            {/* Bell/Notification icon */}
            <div className="relative">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setNotificationsOpen(!notificationsOpen);
                }}
                className="relative p-1 text-[#1C1917] hover:text-[#E61E42] transition-colors active-push cursor-pointer bg-transparent block"
              >
                <svg viewBox="0 0 24 24" className="w-5.5 h-5.5 fill-none stroke-current stroke-[2.2]" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {hasUnreadNotifications && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#E61E42] ring-1 ring-white animate-pulse" />
                )}
              </button>

              <NotificationPopover 
                isOpen={notificationsOpen}
                onClose={() => setNotificationsOpen(false)}
                notifications={notifications}
                onMarkAsRead={handleMarkAsRead}
                onMarkAllAsRead={handleMarkAllAsRead}
              />
            </div>
          </div>
        </div>

        {/* Row 2: Camera Search input pill matching screenshot */}
        <div 
          onClick={() => setSearchOverlayOpen(true)}
          className="w-full flex items-center bg-white rounded-full border-2 border-[#1C1917] h-10 px-3 cursor-pointer group/search shadow-sm hover:border-[#CA8A04] transition-all duration-300"
        >
          {/* Camera Icon on the left */}
          <svg 
            onClick={(e) => {
              e.stopPropagation();
              setCameraSearchOpen(true);
            }}
            viewBox="0 0 24 24" 
            className="w-5 h-5 text-gray-500 mr-2.5 shrink-0 hover:text-[#E61E42] cursor-pointer transition-colors" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          
          <span className="text-[12px] text-gray-400 font-semibold flex-1 truncate">
            Needoh Jellyfish
          </span>

          {/* Dark Pill Search Icon Button */}
          <div className="h-7.5 w-7.5 rounded-full bg-[#1C1917] text-white flex items-center justify-center hover:bg-[#E61E42] transition-colors ml-2 select-none shrink-0 shadow-sm active-push">
            <Search className="h-3.5 w-3.5 stroke-[2.8]" />
          </div>
        </div>

        {/* Row 3: Horizontal category swipable tab list */}
        <div className="flex items-center gap-5 overflow-x-auto select-none no-scrollbar pb-1 -mx-4 px-4 scroll-smooth">
          {['Explore', 'Rugs & Tapestries', 'Wood Carvings', 'Oils & Cosmetics', 'Guided Tours', 'Surf Lessons', 'Cooking Classes'].map((cat) => {
            // Resolve active tab state from URL parameter
            const catParam = searchParams.get('category');
            const activeCategory = catParam || 'Explore';
            
            let tabName = cat;
            if (cat === 'Explore') tabName = 'Explore';
            else if (cat === 'Rugs & Tapestries') tabName = 'Rugs';
            else if (cat === 'Wood Carvings') tabName = 'Wood Carvings';
            else if (cat === 'Oils & Cosmetics') tabName = 'Oils';
            else if (cat === 'Guided Tours') tabName = 'Guided Tours';
            else if (cat === 'Surf Lessons') tabName = 'Surf Lessons';
            else if (cat === 'Cooking Classes') tabName = 'Cooking';

            let queryVal = '';
            if (cat === 'Rugs & Tapestries') queryVal = 'Rugs & Tapestries';
            else if (cat === 'Wood Carvings') queryVal = 'Wood Carvings';
            else if (cat === 'Oils & Cosmetics') queryVal = 'Oils & Cosmetics';
            else if (cat === 'Guided Tours') queryVal = 'Excursions & Guided Tours';
            else if (cat === 'Surf Lessons') queryVal = 'Surf & Water Sports Lessons';
            else if (cat === 'Cooking Classes') queryVal = 'Culinary Arts & Cooking Classes';

            const href = queryVal ? `/?category=${encodeURIComponent(queryVal)}` : '/';
            const isActive = (cat === 'Explore' && activeCategory === 'Explore') || (queryVal && activeCategory === queryVal);

            return (
              <Link 
                key={cat}
                href={href}
                className="flex-shrink-0 relative py-1 flex flex-col items-center justify-center cursor-pointer active:opacity-85"
              >
                <span className={`text-[12px] font-sans tracking-wide transition-colors duration-200 ${
                  isActive ? 'text-[#1C1917] font-black' : 'text-text-secondary font-semibold'
                }`}>
                  {tabName}
                </span>
                {isActive && (
                  <div className="absolute bottom-0 w-8 h-[2.5px] bg-[#E61E42] rounded-full animate-in fade-in zoom-in duration-300" />
                )}
              </Link>
            );
          })}
        </div>

      </div>

      {/* ========================================================
          DESKTOP-ONLY HEADER BLOCK (ORIGINAL DESKTOP LAYOUT) 
          ======================================================== */}
      <div className="hidden md:block mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
            <button
              onClick={() => setCartDrawerOpen(true)}
              className="relative p-1.5 text-[#44403C] hover:text-[#CA8A04] transition-colors cursor-pointer"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#1C1917] text-[8px] font-bold text-white shadow-sm ring-2 ring-white">
                  {cartItemsCount}
                </span>
              )}
            </button>

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
            <button 
              onClick={() => setCartDrawerOpen(true)} 
              className="relative p-1.5 text-[#1C1917] cursor-pointer"
            >
              <ShoppingBag className="h-5.5 w-5.5" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#CA8A04] text-[8px] font-bold text-white">
                  {cartItemsCount}
                </span>
              )}
            </button>
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

      {/* 2. Secondary Sub-Header Categories Row (AliExpress Links Bar Style) - DESKTOP ONLY */}
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

      {/* Global Slide-over Cart Drawer */}
      <CartDrawer 
        isOpen={cartDrawerOpen} 
        onClose={() => setCartDrawerOpen(false)} 
      />

      {/* Gemini-Powered Camera Search Modal */}
      <CameraSearchModal 
        isOpen={cameraSearchOpen} 
        onClose={() => setCameraSearchOpen(false)} 
      />
    </header>
  );
}
