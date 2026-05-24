'use client';

import { buildProductMessage, buildStoreMessage, buildWhatsAppUrl } from '@/lib/whatsapp/context-builder';
import { ProductContext, StoreContext } from '@/lib/whatsapp/types';

export function useWhatsApp() {
  const getIsMobile = (): boolean => {
    if (typeof window === 'undefined') return false;
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  };

  // Opens WhatsApp with product context
  const openProductChat = (product: ProductContext) => {
    if (typeof window === 'undefined') return;
    const url = window.location.href;
    const message = buildProductMessage(product, url);
    const isMobile = getIsMobile();
    const waUrl = buildWhatsAppUrl(message, isMobile);
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // Opens WhatsApp with store context
  const openStoreChat = (store: StoreContext) => {
    if (typeof window === 'undefined') return;
    const url = window.location.href;
    const message = buildStoreMessage(store, url);
    const isMobile = getIsMobile();
    const waUrl = buildWhatsAppUrl(message, isMobile);
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return { openProductChat, openStoreChat };
}
