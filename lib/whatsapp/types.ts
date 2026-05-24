export type ProductContext = {
  pageType: 'product';
  productId: string;
  productName: string;
  productNameAr?: string;
  storeName: string;
  storeId: string;
  category: string;
  price: number;
  comparePrice?: number;
  inStock: boolean;
  stockCount: number;
  productType: 'physical' | 'experience';
  rating: number;
  totalReviews: number;
  // experience only
  duration?: number;
  maxParticipants?: number;
  meetingPoint?: string;
};

export type StoreContext = {
  pageType: 'store';
  storeId: string;
  storeName: string;
  storeCategory: string;
  storeLocation: string;
  storeRating: number;
  totalReviews: number;
  totalProducts: number;
};
