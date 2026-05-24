'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
import { useMyStore } from '@/hooks/useMyStore';
import StoreSetupWizard from '@/components/store/StoreSetupWizard';
import { 
  LayoutDashboard, Package, ShoppingCart, BarChart3, Store, 
  ArrowLeft, Loader2, Menu, X, ArrowUpRight, ShieldAlert 
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoaded: userLoaded, isSignedIn } = useUser();
  const clerk = useClerk();
  
  // Custom hook: retrieves current user's store and a secure creation mutation
  const { store, loading: storeLoading, createStore } = useMyStore(user?.id);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 1. Loading fallbacks
  if (!userLoaded || storeLoading) {
    return (
      <div className="w-full min-h-screen bg-[#F9FAFB] flex flex-col" >
        <div className="flex-1 flex flex-col items-center justify-center py-20 select-none">
          <Loader2 className="h-10 w-10 animate-spin text-[#18181B]" />
          <p className="mt-4 text-xs font-extrabold text-[#71717A] uppercase tracking-widest animate-pulse">
            Loading Workshop Portal...
          </p>
        </div>
      </div>
    );
  }

  // 2. Authentication locks
  if (!isSignedIn) {
    return (
      <div className="w-full min-h-screen bg-[#F9FAFB] flex flex-col" >
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center select-none">
          <div className="rounded-3xl border border-[rgba(232,227,216,0.45)] bg-white p-8 max-w-sm shadow-md">
            <ShieldAlert className="w-12 h-12 text-[#18181B] mx-auto mb-4 animate-bounce" />
            <h3 className="font-bold text-lg text-[#18181B]" >Merchant Portal Locked</h3>
            <p className="text-xs text-[#71717A] mt-2 mb-6 leading-relaxed">
              Please sign in to access the independent artisan merchant dashboard and manage your workshop catalog.
            </p>
            <button
              onClick={() => clerk.openSignIn()}
              className="w-full rounded-xl bg-[#18181B] px-5 py-3 text-xs font-bold text-white shadow-md hover:bg-[#18181B]/90"
            >
              Sign In as Seller
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Onboarding Interceptor: User is authenticated but has NO store registered
  if (!store) {
    const handleLaunchStore = async (formData: any) => {
      const result = await createStore(formData);
      if (result.error) {
        alert(result.error);
      }
    };

    return (
      <div className="w-full min-h-screen bg-[#F9FAFB]" >
        <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
          <div className="text-center max-w-lg mx-auto mb-10 select-none">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#18181B]/10 text-[#18181B] font-bold text-[9px] tracking-widest rounded-lg uppercase">
              Artisan Launchpad
            </span>
            <h1 className="text-3xl font-extrabold text-[#18181B] mt-3" >
              Open Your Medina Workshop
            </h1>
            <p className="text-xs text-[#71717A] leading-relaxed mt-2">
              Transform from a buyer into an independent merchant. List products, fulfill orders under escrow guarantee, and view daily sales metrics.
            </p>
          </div>

          {/* Onboarding Wizard mount */}
          <StoreSetupWizard onComplete={handleLaunchStore} />
        </div>
      </div>
    );
  }

  // Define sidebar navigation parameters
  const menuItems = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/products', label: 'Products', icon: Package },
    { href: '/dashboard/orders', label: 'Orders', icon: ShoppingCart },
    { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/dashboard/store', label: 'Store Profile', icon: Store },
  ];

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    router.push(href);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col md:flex-row" >
      
      {/* PERSISTENT DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-[#18181B] text-white shrink-0 border-r border-[#1F2937] p-6 justify-between select-none">
        <div className="space-y-8">
          
          {/* Brand header */}
          <div className="space-y-1">
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#71717A] hover:text-[#18181B] transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Return to Marketplace
            </Link>
            <div className="pt-3">
              <h2 className="text-lg font-extrabold tracking-tight truncate text-white" >
                {store.name}
              </h2>
              <span className="inline-block rounded bg-indigo-500/20 px-2 py-0.5 text-[8px] font-bold tracking-widest text-[#18181B] uppercase mt-1">
                {store.category} Workshop
              </span>
            </div>
          </div>

          {/* Navigation Links list */}
          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => handleNavClick(item.href)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold tracking-wide spring-transition cursor-pointer text-left ${
                    isActive
                      ? 'bg-[#18181B] text-white shadow-md'
                      : 'text-[#71717A] hover:bg-[#1F2937] hover:text-white'
                  }`}
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Small footer context */}
        <div className="border-t border-[#1F2937] pt-4 text-[9px] text-[#71717A] font-bold leading-normal">
          <span>Essaouira Multi-Vendor Portal</span>
          <span className="block mt-0.5">Secure Escrow Vetted.</span>
        </div>
      </aside>

      {/* MOBILE RESPONSIVE NAVIGATION HEADER */}
      <header className="md:hidden bg-[#18181B] text-white px-4 py-3 shrink-0 flex items-center justify-between border-b border-[#1F2937] select-none z-40 relative">
        <div className="flex flex-col min-w-0">
          <Link href="/" className="inline-flex items-center gap-1 text-[10px] font-bold text-[#71717A]">
            <ArrowLeft className="h-3 w-3" /> Market
          </Link>
          <span className="text-sm font-bold truncate text-white max-w-[150px] mt-0.5" >
            {store.name}
          </span>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 hover:bg-[#1F2937] rounded-lg transition-colors cursor-pointer text-gray-300"
          aria-label="Toggle Dashboard Menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Mobile menu slide down drawer overlay */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-[#18181B] border-b border-[#1F2937] p-4 space-y-2.5 animate-in slide-in-from-top-4 duration-200">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => handleNavClick(item.href)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold spring-transition text-left cursor-pointer ${
                    isActive ? 'bg-[#18181B] text-white' : 'text-[#71717A] hover:bg-[#1F2937] hover:text-white'
                  }`}
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* SUB-PAGES CHANNELS */}
      <main className="flex-1 min-w-0 p-6 md:p-8 overflow-y-auto">
        {children}
      </main>

    </div>
  );
}
