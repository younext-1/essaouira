'use client';

import { Product } from '@/types';
import { Edit2, Trash2, Tag } from 'lucide-react';

interface StoreProductCardProps {
  product: Product;
  isOwner?: boolean;
  onEdit?: (product: Product) => void;
  onDelete?: (id: string) => void;
}

export default function StoreProductCard({
  product,
  isOwner = false,
  onEdit,
  onDelete,
}: StoreProductCardProps) {
  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-[24px] border border-[rgba(232,227,216,0.45)] glass-premium-white p-4 spring-transition hover-lift">
      
      <div className="relative aspect-square w-full overflow-hidden rounded-[16px] bg-[#F5F0E8]">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover spring-transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-accent-gradient font-display text-3xl font-bold text-white uppercase">
            {product.name.substring(0, 2)}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between pt-4">
        <div>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#F5F0E8] border border-white px-2.5 py-0.5 text-[9px] font-bold text-[#18181B] uppercase tracking-wider">
            <Tag className="h-2.5 w-2.5" />
            {typeof product.category === 'object' && product.category
              ? product.category.name
              : (product.category || 'Craft')}
          </span>
          <h4 className="font-display text-sm font-bold text-[#18181B] mt-2 line-clamp-1">
            {product.name}
          </h4>
          <p className="mt-1 text-[11px] leading-relaxed text-[#71717A] line-clamp-2">
            {product.description || 'No description provided.'}
          </p>
        </div>

        <div className="mt-4 border-t border-[rgba(232,227,216,0.45)] pt-3 flex items-center justify-between">
          <div className="flex items-baseline gap-0.5 text-[#18181B]">
            <span className="text-xs font-semibold text-[#71717A]">Avg rating:</span>
            <span className="text-sm font-black ml-1">{product.avg_rating}</span>
            <span className="text-[9px] text-[#71717A]">/5</span>
          </div>

          {isOwner && onEdit && onDelete && (
            <div className="flex items-center gap-1.5 select-none">
              <button
                onClick={() => onEdit(product)}
                className="p-1.5 rounded-lg border border-[rgba(232,227,216,0.8)] bg-[#F5F0E8] text-[#71717A] hover:border-[#18181B] hover:text-[#18181B] spring-transition active-push cursor-pointer"
                aria-label="Edit listing"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onDelete(product.id)}
                className="p-1.5 rounded-lg border border-red-100 bg-[#F5F0E8] text-red-500 hover:border-red-500 hover:bg-red-50 spring-transition active-push cursor-pointer"
                aria-label="Delete listing"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
