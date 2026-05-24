'use client';

import Link from 'next/link';
import { Store as StoreType } from '../types';
import { ChevronRight, Package } from 'lucide-react';

interface StoreCardProps {
  store: StoreType;
}

export default function StoreCard({ store }: StoreCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase() || 'S';
  };

  return (
    <Link
      href={`/store/${store.id}`}
      className="group relative flex flex-col justify-between overflow-hidden rounded-[24px] border border-[rgba(232,227,216,0.45)] glass-premium-white p-6 spring-transition hover-lift"
    >
      <div>
        <div className="flex items-start justify-between gap-4">
          {store.logo_url ? (
            <img
              src={store.logo_url}
              alt={store.name}
              className="h-16 w-16 rounded-[16px] object-cover border border-white shadow-sm spring-transition group-hover:scale-105"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-[16px] bg-accent-gradient font-display text-xl font-bold text-white shadow-sm">
              {getInitials(store.name)}
            </div>
          )}

          {store.category && (
            <span className="inline-flex items-center rounded-full bg-[#F5F0E8] px-3 py-1 text-xs font-semibold text-[#18181B] tracking-wide uppercase border border-white">
              {store.category}
            </span>
          )}
        </div>

        <div className="mt-5">
          <h3 className="font-display text-lg font-bold text-[#18181B] spring-transition group-hover:text-[#CA8A04]">
            {store.name}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#71717A]">
            {store.description || 'Discover local handmade crafts, traditional spices, and premium organic oils direct from Essaouira artisans.'}
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-[rgba(232,227,216,0.45)] pt-4">
        <div className="flex items-center gap-1.5 text-xs font-medium text-[#71717A]">
          <Package className="h-4 w-4 text-[#CA8A04]" />
          <span className="text-[#18181B] font-semibold">
            {store.product_count ?? 0}
          </span>{' '}
          products listed
        </div>
        <span className="flex items-center text-xs font-bold text-[#CA8A04] spring-transition group-hover:gap-1">
          Explore Store
          <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}
