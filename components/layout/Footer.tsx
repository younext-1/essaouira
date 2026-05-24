"use client";

import Link from "next/link";
import { Store, ShieldCheck, HeartHandshake, Truck, MapPin } from "lucide-react";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  // Hide footer inside dashboards and auth portals
  if (
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/sign-in") ||
    pathname?.startsWith("/sign-up")
  ) {
    return null;
  }

  const shopCategories = [
    { name: "Artisanal Wood", href: "/category/Wood%20Carvings" },
    { name: "Cosmetics & Oils", href: "/category/Oils%20&%20Cosmetics" },
    { name: "Moroccan Rugs", href: "/category/Rugs%20&%20Tapestries" },
    { name: "Excursions & Lessons", href: "/search" },
  ];

  const legalLinks = [
    { name: "Buyer Protection", href: "/search" },
    { name: "Shipping Policies", href: "/search" },
    { name: "Terms of Service", href: "/search" },
    { name: "Contact & Support", href: "/search" },
  ];

  return (
    <footer className="w-full bg-[#F5F0E8] border-t border-warm-border pt-16 pb-28 md:pb-16 select-none font-sans" style={{ fontFamily: 'var(--font-sans), sans-serif' }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Trust Badges Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12 border-b border-warm-border/50 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-warm-border/55 text-[#CA8A04] shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#1C1917] uppercase tracking-wider">Escrow Buyer Protection</h4>
              <p className="text-[11.5px] text-text-secondary mt-1 leading-relaxed font-light">
                Funds are securely held and only released to the artisan after successful global delivery.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-warm-border/55 text-[#CA8A04] shadow-sm">
              <HeartHandshake className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#1C1917] uppercase tracking-wider">Direct-to-Artisan Fair Trade</h4>
              <p className="text-[11.5px] text-text-secondary mt-1 leading-relaxed font-light">
                Zero middlemen. Direct transparent fair trade payments to master creators in the Essaouira Medina.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-warm-border/55 text-[#CA8A04] shadow-sm">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#1C1917] uppercase tracking-wider">Medina Express Delivery</h4>
              <p className="text-[11.5px] text-text-secondary mt-1 leading-relaxed font-light">
                Carefully wrapped and packaged with real museum tags, shipped securely direct to your door worldwide.
              </p>
            </div>
          </div>
        </div>

        {/* Directory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 py-16">
          
          {/* Brand Pitch column */}
          <div className="md:col-span-5 space-y-5 text-center md:text-left">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1C1917] text-white shadow-sm transition-all duration-300 group-hover:bg-[#CA8A04]">
                <Store className="h-4.5 w-4.5" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-base font-black tracking-tight text-[#1C1917]" style={{ fontFamily: 'var(--font-display), serif' }}>
                  MOGADOR
                </span>
                <span className="text-[8px] font-extrabold tracking-widest text-[#CA8A04] uppercase">
                  Craft Marketplace
                </span>
              </div>
            </Link>
            
            <p className="text-xs leading-relaxed text-text-secondary max-w-sm font-light">
              Mogador is a curated fair-trade platform connecting authentic independent Moroccan artisans from the winding Medina of Essaouira directly to global homes. We verify every product for material heritage and local craftsmanship.
            </p>
            
            <div className="flex items-center justify-center md:justify-start gap-1.5 text-[10.5px] font-semibold text-text-secondary">
              <MapPin className="h-3.5 w-3.5 text-[#CA8A04] shrink-0" />
              <span>Medina of Essaouira, Morocco</span>
            </div>
          </div>

          {/* Quick links columns */}
          <div className="md:col-span-3 text-center md:text-left space-y-4">
            <h4 className="text-[10px] font-black text-[#1C1917] uppercase tracking-widest">Shop Boutiques</h4>
            <ul className="space-y-2 text-xs font-semibold">
              {shopCategories.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-text-secondary hover:text-[#CA8A04] transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4 text-center md:text-left space-y-4">
            <h4 className="text-[10px] font-black text-[#1C1917] uppercase tracking-widest">Heritage Trust & Safe Shop</h4>
            <ul className="space-y-2 text-xs font-semibold">
              {legalLinks.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-text-secondary hover:text-[#CA8A04] transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Credit Tag bottom */}
        <div className="border-t border-warm-border/50 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-text-secondary font-semibold uppercase tracking-wider select-none text-center sm:text-left">
          <span>&copy; {new Date().getFullYear()} MOGADOR. All rights reserved.</span>
          <span className="flex items-center gap-1">
            ✦ Direct-to-Artisan Fair Trade Escrow Guarantee ✦
          </span>
        </div>

      </div>
    </footer>
  );
}
