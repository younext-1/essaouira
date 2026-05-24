import { WHATSAPP_CONFIG } from './constants';
import { ProductContext, StoreContext } from './types';

// Truncates strings to 100 characters
const truncate = (str: string | undefined, limit = 100): string => {
  if (!str) return '';
  return str.length > limit ? str.substring(0, limit) + '...' : str;
};

// Builds full pre-filled message for product
export function buildProductMessage(
  product: ProductContext,
  currentUrl: string
): string {
  const lines: string[] = [
    '[CONTEXT_START]',
    `page_type: product`,
    `product_id: ${product.productId}`,
    `product_name: ${truncate(product.productName)}`,
  ];

  if (product.productNameAr) {
    lines.push(`product_name_ar: ${truncate(product.productNameAr)}`);
  }

  lines.push(
    `store_name: ${truncate(product.storeName)}`,
    `store_id: ${product.storeId}`,
    `category: ${truncate(product.category)}`,
    `price: ${product.price} MAD`
  );

  if (product.comparePrice !== undefined && product.comparePrice !== null) {
    lines.push(`compare_price: ${product.comparePrice} MAD`);
  }

  lines.push(
    `in_stock: ${product.inStock ? 'yes' : 'no'}`,
    `stock_count: ${product.stockCount}`,
    `product_type: ${product.productType}`,
    `rating: ${product.rating} (${product.totalReviews} reviews)`
  );

  // Experience-specific fields
  if (product.productType === 'experience') {
    if (product.duration !== undefined && product.duration !== null) {
      lines.push(`duration: ${product.duration} hours`);
    }
    if (product.maxParticipants !== undefined && product.maxParticipants !== null) {
      lines.push(`max_participants: ${product.maxParticipants}`);
    }
    if (product.meetingPoint !== undefined && product.meetingPoint !== null && product.meetingPoint.trim() !== '') {
      lines.push(`meeting_point: ${truncate(product.meetingPoint)}`);
    }
  }

  lines.push(
    `product_url: ${currentUrl}`,
    '[CONTEXT_END]',
    'السلام عليكم، أريد الاستفسار عن هذا المنتج'
  );

  return lines.join('\n');
}

// Builds full pre-filled message for store
export function buildStoreMessage(
  store: StoreContext,
  currentUrl: string
): string {
  const lines: string[] = [
    '[CONTEXT_START]',
    `page_type: store`,
    `store_id: ${store.storeId}`,
    `store_name: ${truncate(store.storeName)}`,
    `store_category: ${truncate(store.storeCategory)}`,
    `store_location: ${truncate(store.storeLocation)}`,
    `store_rating: ${store.storeRating} (${store.totalReviews} reviews)`,
    `total_products: ${store.totalProducts}`,
    `store_url: ${currentUrl}`,
    '[CONTEXT_END]',
    'السلام عليكم، أريد الاستفسار عن هذا المتجر'
  ];

  return lines.join('\n');
}

// Builds final wa.me URL with encoded message, supporting optional isMobile override
export function buildWhatsAppUrl(message: string, isMobile = true): string {
  const encoded = encodeURIComponent(message);
  const number = WHATSAPP_CONFIG.phoneNumber.replace('+', '');
  
  if (!isMobile) {
    return `${WHATSAPP_CONFIG.webBaseUrl}?phone=${number}&text=${encoded}`;
  }
  return `${WHATSAPP_CONFIG.waBaseUrl}/${number}?text=${encoded}`;
}
