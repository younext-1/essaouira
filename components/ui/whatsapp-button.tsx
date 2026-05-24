'use client';

import { useWhatsApp } from '@/hooks/use-whatsapp';
import { ProductContext, StoreContext } from '@/lib/whatsapp/types';

type WhatsAppButtonProps = {
  context: ProductContext | StoreContext;
  variant?: 'floating' | 'inline' | 'card';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
};

export default function WhatsAppButton({
  context,
  variant = 'inline',
  size = 'md',
  label,
}: WhatsAppButtonProps) {
  const { openProductChat, openStoreChat } = useWhatsApp();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (context.pageType === 'product') {
      openProductChat(context);
    } else {
      openStoreChat(context);
    }
  };

  // Official WhatsApp SVG Icon
  const icon = (
    <svg 
      className={`fill-current shrink-0 ${variant === 'card' ? 'h-5.5 w-5.5' : size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-5.5 w-5.5' : 'h-5 w-5'}`} 
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.46h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );

  if (variant === 'floating') {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes wa-pulse-glow {
            0%, 100% {
              transform: scale(1);
              box-shadow: 0 10px 25px -5px rgba(37, 211, 102, 0.4), 0 8px 10px -6px rgba(37, 211, 102, 0.4);
            }
            50% {
              transform: scale(1.06);
              box-shadow: 0 20px 25px -5px rgba(37, 211, 102, 0.6), 0 10px 10px -6px rgba(37, 211, 102, 0.6);
            }
          }
          .wa-floating-btn {
            animation: wa-pulse-glow 3s infinite ease-in-out;
          }
        `}} />
        <button
          onClick={handleClick}
          className="wa-floating-btn fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] hover:bg-[#128C7E] text-white transition-colors duration-200 cursor-pointer border border-[#25D366]/40 select-none group"
          title={label || 'تواصل عبر واتساب'}
          aria-label={label || 'Contact on WhatsApp'}
        >
          {icon}
        </button>
      </>
    );
  }

  if (variant === 'card') {
    return (
      <div className="absolute bottom-3.5 right-3.5 z-30 group/wa select-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {/* Tooltip */}
        <span className="absolute bottom-full right-1/2 translate-x-1/2 mb-2 w-max px-2.5 py-1 text-[9px] font-bold text-white bg-black/85 rounded-lg opacity-0 pointer-events-none group-hover/wa:opacity-100 transition-opacity duration-200 uppercase tracking-wide border border-white/10 shadow-md">
          تواصل عبر واتساب
        </span>
        <button
          onClick={handleClick}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366] hover:bg-[#128C7E] text-white shadow-md spring-transition cursor-pointer border border-[#25D366]/20 transition-all duration-200 scale-95 hover:scale-105 active:scale-95"
          aria-label="Contact on WhatsApp"
        >
          {icon}
        </button>
      </div>
    );
  }

  // Inline Button
  const sizeClasses = {
    sm: 'py-2 px-4 text-[10px] rounded-lg',
    md: 'py-2.5 px-5 text-xs rounded-xl',
    lg: 'py-3.5 px-6 text-sm rounded-xl',
  };

  const defaultLabel = context.pageType === 'product' 
    ? 'اسأل عن هذا المنتج عبر واتساب' 
    : 'تواصل مع المتجر عبر واتساب';

  return (
    <button
      onClick={handleClick}
      className={`w-full flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer border border-[#25D366]/25 select-none ${sizeClasses[size]}`}
    >
      {icon}
      <span className="tracking-wide" dir="rtl">
        {label || defaultLabel}
      </span>
    </button>
  );
}
