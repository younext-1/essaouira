// Consolidated Master Database Schema Types for Mogador Connect
// File: lib/database.types.ts
// Consolidates all core, messaging, reviews, shipping, orders, cart-checkout, payments, and analytics types.

// =========================================================
// 1. CORE TYPES
// =========================================================

export interface Profile {
  id: string
  clerk_id: string
  email: string | null
  role: 'tourist' | 'artisan' | 'moderator' | 'admin' | null
  username: string
  full_name: string | null
  full_name_ar?: string | null
  avatar_url: string | null
  cover_url?: string | null
  title?: string | null
  title_ar?: string | null
  bio: string | null
  bio_ar?: string | null
  phone: string | null
  is_tourist: boolean
  is_artisan: boolean
  verified: boolean
  onboarding_done: boolean
  craft_category?: string | null
  languages?: string[]
  is_open_now?: boolean
  work_start_time?: string
  work_end_time?: string
  work_days?: string[]
  custom_html?: string | null
  custom_html_enabled?: boolean
  custom_html_filename?: string | null
  website?: string | null
  whatsapp?: string | null
  instagram?: string | null
  facebook?: string | null
  tiktok?: string | null
  created_at: string
  updated_at?: string
  deleted_at: string | null
}

export interface ProfileVerification {
  id: string
  profile_id: string
  document_type: string
  document_url: string
  status: 'pending' | 'approved' | 'rejected'
  reviewed_by: string | null
  reviewed_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface AuditLog {
  id: string
  actor_id: string | null
  action: string
  target_type: string
  target_id: string
  metadata: any
  ip_address: string | null
  created_at: string
}

export interface Store {
  id: string
  owner_id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  banner_url: string | null
  avatar_url?: string | null
  category: string | null
  location: string | null
  coordinates?: { x: number; y: number } | string | null
  phone?: string | null
  whatsapp?: string | null
  working_hours?: Record<string, string> | null
  is_active?: boolean
  is_verified?: boolean
  rating?: number
  total_sales?: number
  total_reviews?: number
  review_count?: number // for backward compatibility
  onboarding_completed?: boolean
  ai_instructions?: string | null
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
  owner_name?: string
  product_count?: number
}

export interface StoreMetric {
  id: string
  store_id: string
  date: string
  views: number
  orders: number
  revenue: number
  avg_response_time_minutes: number
  cancellation_rate: number
  created_at: string
}

export interface StoreTier {
  id: string
  name: string
  max_products: number
  commission_rate: number
  featured_slots: number
  price_mad: number
  features: Record<string, any>
  created_at: string
  updated_at: string
}

export interface StoreSubscription {
  id: string
  store_id: string
  tier_id: string
  starts_at: string
  ends_at: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface OnboardingStep {
  id: string
  store_id: string
  profile_added: boolean
  payout_connected: boolean
  first_product_created: boolean
  shipping_policy_set: boolean
  store_description_added: boolean
  created_at: string
  updated_at: string
}

export interface ProfileStat {
  id: string
  profile_id: string
  label: string
  value: string
  suffix: string
  sort_order: number
}

export interface Specialty {
  id: string
  profile_id: string
  icon: string | null
  label: string
  is_active: boolean
  sort_order: number
}

export interface Service {
  id: string
  profile_id: string
  icon: string | null
  title: string
  description: string | null
  duration: string | null
  price: string | null
  price_mad: number | null
  price_usd?: number | null
  is_available: boolean
  sort_order: number
  created_at: string
}

export interface Post {
  id: string
  author_id: string
  title: string | null
  content: string | null
  category: 'artisan' | 'music' | 'surf' | 'food' | 'culture' | 'tourism' | 'other' | null
  location: string | null
  is_featured: boolean
  is_published: boolean
  view_count: number
  created_at: string
  updated_at: string
}

export interface PostImage {
  id: string
  post_id: string
  url: string
  alt: string | null
  sort_order: number
}

export interface PostTag {
  id: string
  post_id: string
  tag: string
}

export interface Like {
  id: string
  user_id: string
  post_id: string
  created_at: string
}

export interface Bookmark {
  id: string
  user_id: string
  post_id: string
  created_at: string
}

export interface Follow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}

export interface PortfolioItem {
  id: string
  profile_id: string
  title: string
  image_url: string | null
  price_mad: number | null
  price_usd?: number | null
  sort_order: number
  created_at: string
}

export interface Category {
  id: string
  name: string
  name_ar: string | null
  name_fr: string | null
  slug: string
  parent_id: string | null
  icon_url: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  store_id: string
  category_id?: string | null
  name: string
  name_ar: string | null
  name_fr: string | null
  slug: string
  description: string | null
  description_ar?: string | null
  description_fr?: string | null
  price: number
  compare_price?: number | null
  compare_at_price?: number | null
  images: string[]
  thumbnail_url?: string | null
  image_url?: string
  category?: { id: string; name: string; name_ar?: string | null; name_fr?: string | null; slug: string } | null
  type?: 'physical' | 'experience'
  status?: 'draft' | 'active' | 'paused' | 'sold_out' | 'archived' | string
  stock: number
  weight?: number | null
  weight_grams?: number | null
  dimensions?: { length: number; width: number; height: number } | null
  tags: string[]
  metadata?: Record<string, any>
  total_sales?: number
  total_reviews?: number
  rating?: number
  avg_rating?: number // for backward compatibility
  is_featured?: boolean
  is_published?: boolean
  created_at?: string
  updated_at?: string
  stores?: {
    id?: string
    name: string
    slug: string
    logo_url?: string | null
    location?: string | null
    avatar_url?: string | null
    phone?: string | null
    whatsapp?: string | null
    rating?: number
  }
  variants?: ProductVariant[]
}

export interface ProductVariant {
  id: string
  product_id: string
  name: string
  value?: string
  options?: { name: string; price_modifier: number; stock: number }[]
  sku?: string
  price_override?: number | null
  price_modifier?: number
  stock: number
  images?: string[]
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface ProductInventory {
  id: string
  product_id: string
  variant_id: string | null
  quantity: number
  reserved: number
  available: number
  last_updated: string
}

export interface InventoryLock {
  id: string
  checkout_id: string
  product_id: string
  variant_id: string | null
  quantity: number
  locked_at?: string
  expires_at: string
  created_at?: string
  released?: boolean
}

export interface ExperienceDetails {
  id: string
  product_id: string
  duration_hours: number
  max_participants: number
  meeting_point: string
  meeting_point_coords: { x: number; y: number } | string | null
  languages: string[]
  includes: string[]
  excludes: string[]
  cancellation_policy: string | null
  min_age: number | null
  created_at: string
  updated_at: string
}

export interface ExperienceSlot {
  id: string
  product_id: string
  date: string
  start_time: string
  max_participants: number
  booked_count: number
  is_available: boolean
  price_override: number | null
  created_at: string
  updated_at: string
}

export interface ProductFilters {
  category?: string
  type?: 'physical' | 'experience'
  price_min?: number
  price_max?: number
  rating?: number
  location?: string
  tags?: string[]
  store_id?: string
  status?: 'draft' | 'active' | 'paused' | 'sold_out' | 'archived'
}

export interface ProductSearchResult {
  products: (Product & {
    store?: { name: string; slug: string; location: string | null; rating: number } | null
    category?: { name: string; name_ar: string | null; name_fr: string | null; slug: string } | null
  })[]
  stores: { id: string; name: string; slug: string; rating: number }[]
  categories: { id: string; name: string; slug: string }[]
}

export interface CreateProductInput {
  category_id?: string | null
  name: string
  name_ar?: string | null
  name_fr?: string | null
  description?: string | null
  description_ar?: string | null
  description_fr?: string | null
  price: number
  compare_at_price?: number | null
  images?: string[]
  thumbnail_url?: string | null
  type: 'physical' | 'experience'
  status?: 'draft' | 'active' | 'paused' | 'sold_out' | 'archived'
  stock?: number
  weight_grams?: number | null
  dimensions?: { length: number; width: number; height: number } | null
  tags?: string[]
  metadata?: Record<string, any>
  is_featured?: boolean
  experience_details?: {
    duration_hours: number
    max_participants: number
    meeting_point: string
    meeting_point_coords?: { x: number; y: number } | string | null
    languages?: string[]
    includes?: string[]
    excludes?: string[]
    cancellation_policy?: string | null
    min_age?: number | null
  } | null
}

export interface UpdateProductInput {
  category_id?: string | null
  name?: string
  name_ar?: string | null
  name_fr?: string | null
  description?: string | null
  description_ar?: string | null
  description_fr?: string | null
  price?: number
  compare_at_price?: number | null
  images?: string[]
  thumbnail_url?: string | null
  status?: 'draft' | 'active' | 'paused' | 'sold_out' | 'archived'
  stock?: number
  weight_grams?: number | null
  dimensions?: { length: number; width: number; height: number } | null
  tags?: string[]
  metadata?: Record<string, any>
  is_featured?: boolean
  experience_details?: {
    duration_hours?: number
    max_participants?: number
    meeting_point?: string
    meeting_point_coords?: { x: number; y: number } | string | null
    languages?: string[]
    includes?: string[]
    excludes?: string[]
    cancellation_policy?: string | null
    min_age?: number | null
  } | null
}

// =========================================================
// 2. MESSAGING TYPES
// =========================================================

export interface ChatThread {
  id: string
  buyer_id: string
  seller_id: string
  store_id: string
  child_order_id: string | null
  created_at: string
  updated_at: string
  
  // Hydrated fields
  buyer?: Partial<Profile>
  seller?: Partial<Profile>
  store?: Partial<Store>
  unread_count?: number
  last_message?: ChatMessage | null
}

export interface ChatMessage {
  id: string
  thread_id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
  
  // Hydrated fields
  sender?: Partial<Profile>
}

export interface CreateMessageInput {
  threadId: string
  senderId: string
  content: string
}

// =========================================================
// 3. REVIEWS TYPES
// =========================================================

export interface ProductReview {
  id: string
  child_order_id: string
  product_id: string
  variant_id: string | null
  buyer_id: string
  rating: number
  title: string
  body: string
  images: string[]
  helpful_count: number
  is_published: boolean
  published_at: string | null
  created_at: string
  profiles?: {
    full_name: string | null
    avatar_url: string | null
  }
  products?: {
    name: string
    thumbnail_url: string | null
  }
}

export interface BuyerReview {
  id: string
  child_order_id: string
  seller_id: string
  buyer_id: string
  rating: number
  body: string
  is_published: boolean
  published_at: string | null
  created_at: string
  profiles?: {
    full_name: string | null
    avatar_url: string | null
  }
}

export interface StoreTrustMetrics {
  store_id: string
  avg_rating: number
  total_reviews: number
  communication_score: number
  order_completion_rate: number
  on_time_delivery_rate: number
  trust_score: number
  badges: string[]
  updated_at: string
}

export interface CreateProductReviewInput {
  child_order_id: string
  product_id: string
  variant_id?: string | null
  rating: number
  title: string
  body: string
  images?: string[]
}

export interface CreateBuyerReviewInput {
  child_order_id: string
  rating: number
  body: string
}

export interface Review {
  id: string
  product_id: string
  user_id: string
  rating: number
  title: string | null
  body: string | null
  images?: string[]
  helpful_count?: number
  created_at?: string
  profiles?: {
    full_name: string | null
    avatar_url: string | null
  }
  products?: {
    name: string
    images?: string[]
    category: string | null
  }
  has_voted?: boolean
}

// =========================================================
// 4. ORDERS TYPES
// =========================================================

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refund_requested'
  | 'refunded'

export type TransitionActor = 'buyer' | 'seller' | 'system' | 'admin'

export type DisputeReason =
  | 'item_not_received'
  | 'item_damaged'
  | 'item_not_as_described'
  | 'seller_unresponsive'
  | 'other'

export type DisputeStatus = 'open' | 'investigating' | 'resolved' | 'closed'

export type DisputeResolution = 'refund_buyer' | 'release_seller' | 'partial_refund'

export interface ParentOrder {
  id: string
  buyer_id: string | null
  checkout_session_id: string | null
  total_amount: number
  shipping_address: Record<string, any>
  billing_address?: Record<string, any> | null
  currency: string
  notes?: string | null
  status?: string
  shipping_total?: number
  discount_amount?: number
  tax_amount?: number
  created_at: string
  updated_at: string
}

export interface ChildOrder {
  id: string
  parent_id?: string
  parent_order_id?: string
  store_id: string | null
  status: OrderStatus
  subtotal: number
  shipping_cost?: number
  shipping_fee?: number
  platform_fee: number
  seller_earnings: number
  discount_amount?: number
  total_amount?: number
  tracking_number?: string | null
  carrier?: string | null
  shipping_label_url?: string | null
  estimated_delivery?: string | null
  confirmed_at?: string | null
  shipped_at?: string | null
  delivered_at?: string | null
  completed_at?: string | null
  cancelled_at?: string | null
  cancellation_reason?: string | null
  seller_notes?: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  child_order_id: string
  order_id?: string
  product_id: string | null
  variant_id: string | null
  product_snapshot?: Record<string, any>
  quantity: number
  unit_price?: number
  total_price?: number
  price_at_purchase: number
  selected_options?: Record<string, any> | null
  variant?: Record<string, string> | null
  variant_details?: Record<string, any>
  products?: {
    id: string
    name: string
    images?: string[]
    image_url?: string
    stores?: {
      slug: string
    }
  }
  created_at: string
}

export interface OrderHistory {
  id: string
  child_order_id: string
  from_status: string
  to_status: string
  actor_id?: string | null
  actor_role: TransitionActor
  note?: string | null
  metadata?: Record<string, any> | null
  created_at: string
}

export interface OrderDispute {
  id: string
  child_order_id: string
  opened_by: string
  reason: DisputeReason
  description: string
  evidence_urls: string[]
  status: DisputeStatus
  resolution?: DisputeResolution | null
  resolved_by?: string | null
  resolution_notes?: string | null
  opened_at: string
  resolved_at?: string | null
}

export interface OrderTransition {
  allowed: boolean
  reason?: string
}

export interface BuyerOrderItemView {
  name: string
  image: string
  quantity: number
  price: number
  options?: Record<string, any> | null
}

export interface BuyerChildOrderView {
  id: string
  status: OrderStatus
  storeName: string
  storeAvatar?: string | null
  items: BuyerOrderItemView[]
  subtotal: number
  shippingCost: number
  total: number
  tracking?: {
    number?: string | null
    carrier?: string | null
    estimatedDelivery?: string | null
  } | null
  timeline: OrderHistory[]
}

export interface BuyerOrderView {
  parentOrder: {
    id: string
    total: number
    address: Record<string, any>
    createdAt: string
  }
  childOrders: BuyerChildOrderView[]
}

export interface SellerOrderView {
  id: string
  parent_id: string
  status: OrderStatus
  created_at: string
  buyer: {
    name: string
    city: string
    country: string
  }
  items: Array<{
    id: string
    name: string
    image: string
    quantity: number
    price: number
    options?: Record<string, any> | null
    product_id: string | null
    variant_id: string | null
  }>
  financial: {
    subtotal: number
    platformFee: number
    sellerEarnings: number
  }
  shipping: {
    address: Record<string, any>
    cost: number
    label_url?: string | null
    tracking_number?: string | null
    carrier?: string | null
    estimated_delivery?: string | null
  }
  history: OrderHistory[]
}

export interface OrderStats {
  pending: number
  confirmed: number
  shipped: number
  completed: number
  cancelled: number
  revenue_this_month: number
  revenue_last_month: number
  avg_fulfillment_hours: number
}

export interface Order {
  id: string
  buyer_id: string | null
  store_id: string | null
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  total_price?: number
  total_amount: number
  shipping_address: any
  shipping_city?: string
  shipping_phone?: string
  notes: string | null
  created_at: string
  stores?: {
    name: string
    slug: string
  }
  order_items?: OrderItem[]
}

// =========================================================
// 5. SHIPPING TYPES
// =========================================================

export type DeliveryType = 'local' | 'national' | 'international'
export type RateType = 'flat' | 'weight_based' | 'free'

export type ShipmentStatus =
  | 'label_created'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed_delivery'
  | 'returned'

export interface ShippingZone {
  id: string
  name: string
  type: DeliveryType
  countries: string[] | null
  cities: string[] | null
  is_active: boolean
  created_at: string
}

export interface CarrierConfig {
  id: string
  name: string
  code: string
  type: DeliveryType
  logo_url: string | null
  tracking_url_template: string
  api_endpoint: string | null
  api_key_encrypted: string | null
  is_active: boolean
  estimated_days_min: number
  estimated_days_max: number
  created_at: string
}

export interface StoreShippingPolicy {
  id: string
  store_id: string
  offers_local_pickup: boolean
  local_pickup_address: string | null
  local_pickup_coords: string | { x: number; y: number } | null
  local_pickup_fee: number
  local_pickup_instructions: string | null
  offers_national: boolean
  offers_international: boolean
  free_shipping_threshold_mad: number | null
  handling_time_days: number
  ships_from_city: string
  ships_from_coords: string | { x: number; y: number } | null
  return_policy: string | null
  created_at: string
  updated_at: string
}

export interface WeightTier {
  max_weight_g: number
  fee: number
}

export interface StoreShippingRate {
  id: string
  store_id: string
  zone_id: string
  carrier_id: string | null
  rate_type: RateType
  flat_fee: number | null
  weight_tiers: WeightTier[] | null
  min_order_mad: number
  max_order_mad: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PickupHub {
  id: string
  name: string
  address: string
  coords: string | { x: number; y: number } | null
  city: string
  contact_phone: string | null
  working_hours: {
    weekdays: string
    saturday: string
    sunday: string
  }
  max_storage_days: number
  is_active: boolean
  partner_store_id: string | null
  created_at: string
}

export interface TrackingEvent {
  status: ShipmentStatus
  location: string
  timestamp: string
  description: string
}

export interface Shipment {
  id: string
  child_order_id: string
  carrier_id: string | null
  type: DeliveryType
  tracking_number: string | null
  tracking_url: string | null
  shipping_label_url: string | null
  pickup_hub_id: string | null
  origin_address: Record<string, any>
  destination_address: {
    fullName?: string
    line1?: string
    line2?: string | null
    city: string
    state?: string
    postalCode?: string
    country: string
    phone?: string
  }
  weight_grams: number
  dimensions: {
    length_cm: number
    width_cm: number
    height_cm: number
  }
  declared_value: number
  customs_description: string | null
  estimated_delivery: string | null
  shipped_at: string | null
  delivered_at: string | null
  status: ShipmentStatus
  tracking_events: TrackingEvent[]
  created_at: string
  updated_at: string
}

export interface ShippingCalculation {
  storeId: string
  type?: 'local_pickup' | 'national' | 'international'
  shippingCost?: number
  message?: string
  carrier?: {
    id: string | null
    name: string
    logo: string | null
    estimatedDays: string
  } | null
  fee?: number
  isFree?: boolean
  freeThresholdRemaining?: number | null
  estimatedDeliveryRange?: {
    min: string
    max: string
  }
  pickupOptions?: PickupHub[] | null
  customsDutyEstimate?: {
    estimatedRangeMin: number
    estimatedRangeMax: number
    warningMessage: string
  } | null
}

export interface TrackingTimeline {
  currentStatus: ShipmentStatus
  carrier: {
    name: string
    logo_url: string | null
  } | null
  trackingNumber: string | null
  trackingUrl: string | null
  estimatedDelivery: string | null
  timeline: Array<{
    date: string
    time: string
    status: ShipmentStatus
    location: string
    description: string
  }>
}

export interface CreateShipmentInput {
  carrierId: string | null
  type: DeliveryType
  trackingNumber?: string
  pickupHubId?: string | null
  originAddress: Record<string, any>
  destinationAddress: Record<string, any>
  weightGrams: number
  dimensions: {
    length_cm: number
    width_cm: number
    height_cm: number
  }
  declaredValue: number
  customsDescription?: string | null
  estimatedDelivery?: string
  shippingLabelUrl?: string
}

export interface UpdateTrackingInput {
  status: ShipmentStatus
  location: string
  description: string
  timestamp?: string
}

// =========================================================
// 6. CART-CHECKOUT TYPES
// =========================================================

export interface Cart {
  id: string
  buyer_id: string | null
  guest_token: string | null
  status: 'active' | 'checked_out' | 'abandoned' | 'merged'
  coupon_code: string | null
  discount_amount: number
  created_at: string
  updated_at: string
  expires_at: string
}

export interface CartItem {
  id: string
  cart_id: string
  user_id?: string
  product_id: string
  variant_id: string | null
  variant?: any
  quantity: number
  price_at_add: number
  store_id: string
  added_at?: string
  created_at?: string
  products?: Product
}

export interface FullCartItem extends CartItem {
  product: Product
  variant: ProductVariant | null
}

export interface StoreCartSummary {
  storeId: string
  storeName: string
  items: FullCartItem[]
  subtotal: number
  shippingCost: number
  storeTotal: number
}

export interface CartSummary {
  cartId: string
  stores: StoreCartSummary[]
  subtotal: number
  shippingTotal: number
  discountAmount: number
  taxAmount: number
  totalAmount: number
  itemCount: number
  couponCode: string | null
}

export interface CheckoutSession {
  id: string
  cart_id: string
  buyer_id: string | null
  status: 'initiated' | 'payment_pending' | 'payment_failed' | 'completed' | 'abandoned'
  shipping_address: any
  billing_address: any
  partitioned_stores: StoreCartSummary[]
  subtotal: number
  shipping_total: number
  discount_amount: number
  tax_amount: number
  total_amount: number
  payment_intent_id: string | null
  coupon_id: string | null
  expires_at: string
  created_at: string
  updated_at: string
}

export interface AbandonedCheckout {
  id: string
  checkout_session_id: string
  buyer_email: string | null
  cart_snapshot: any
  recovery_token: string
  recovery_sent_at: string | null
  recovered_at: string | null
  discount_offered: number
  created_at: string
}

export interface Coupon {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_order_amount: number
  max_discount_amount: number | null
  valid_from: string
  valid_until: string
  max_usages: number
  used_count: number
  is_active: boolean
  applicable_product_ids: string[]
  applicable_store_ids: string[]
  created_at: string
}

export interface CouponValidation {
  valid: boolean
  discountAmount: number
  discountType: 'percentage' | 'fixed' | null
  message: string
}

export interface AddToCartInput {
  productId: string
  variantId?: string | null
  quantity: number
}

export interface InitializeCheckoutInput {
  shippingAddress: {
    fullName: string
    line1: string
    line2?: string
    city: string
    state: string
    postalCode: string
    country: string
    phone: string
  }
  billingAddress?: {
    fullName: string
    line1: string
    line2?: string
    city: string
    state: string
    postalCode: string
    country: string
    phone: string
  }
}

export interface WishlistItem {
  id: string
  user_id: string
  product_id: string
  created_at?: string
  products?: Product
}

// =========================================================
// 7. PAYMENTS TYPES
// =========================================================

export type TransactionGateway = 'stripe' | 'cod' | 'bank_transfer'
export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'disputed'
export type EscrowStatus = 'holding' | 'released' | 'refunded' | 'disputed'
export type EscrowReleaseTrigger = 'buyer_confirmed' | 'auto_7days' | 'admin_manual' | 'dispute_resolved'
export type PayoutMethod = 'bank_transfer' | 'cash' | 'mobile_money'
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'rejected'
export type RefundReason = 'not_received' | 'damaged' | 'not_as_described' | 'changed_mind' | 'other'
export type RefundStatus = 'pending' | 'investigating' | 'approved' | 'rejected' | 'completed'

export interface Transaction {
  id: string
  checkout_session_id?: string
  parent_order_id?: string
  gateway: TransactionGateway
  gateway_transaction_id?: string
  gateway_response?: Record<string, any>
  amount: number
  currency: string
  exchange_rate: number
  amount_mad: number
  platform_fee: number
  status: TransactionStatus
  paid_at?: string
  refunded_at?: string
  created_at: string
  updated_at: string
}

export interface EscrowLedger {
  id: string
  transaction_id: string
  child_order_id: string
  store_id: string
  gross_amount: number
  platform_fee: number
  shipping_fee: number
  net_amount: number
  status: EscrowStatus
  hold_reason?: string
  release_trigger?: EscrowReleaseTrigger
  held_at: string
  released_at?: string
  dispute_opened_at?: string
}

export interface SellerBalance {
  id: string
  store_id: string
  available_mad: number
  pending_mad: number
  total_earned_mad: number
  total_withdrawn_mad: number
  last_updated: string
}

export interface PayoutRequest {
  id: string
  store_id: string
  amount: number
  method: PayoutMethod
  bank_details: {
    bank_name: string
    account_holder: string
    rib: string
    [key: string]: any
  }
  status: PayoutStatus
  requested_at: string
  processed_at?: string
  processed_by?: string
  rejection_reason?: string
  reference_number?: string
}

export interface CommissionRule {
  id: string
  category?: string
  store_tier_id?: string
  rate: number
  min_fee: number
  max_fee?: number
  is_default: boolean
  effective_from: string
}

export interface RefundRequest {
  id: string
  child_order_id: string
  buyer_id: string
  reason: RefundReason
  description: string
  evidence_urls: string[]
  amount_requested: number
  amount_approved?: number
  status: RefundStatus
  reviewed_by?: string
  resolution_notes?: string
  created_at: string
  updated_at: string
}

export interface CommissionBreakdown {
  grossAmount: number
  platformFee: number
  netAmount: number
  rate: number
}

export interface CODOrder {
  orderId: string
  instructions: string
}

export interface OrderFinancialSummary {
  parentOrderId: string
  subtotal: number
  shippingTotal: number
  discountAmount: number
  taxAmount: number
  totalAmount: number
  storeSplits: Record<string, {
    storeId: string
    subtotal: number
    shippingFee: number
    discountAmount: number
    platformFee: number
    netAmount: number
  }>
}

// =========================================================
// 8. ANALYTICS TYPES
// =========================================================

export type AnalyticsEventType = 
  | 'page_view' 
  | 'product_view' 
  | 'store_view' 
  | 'add_to_cart' 
  | 'initiate_checkout' 
  | 'purchase'

export interface MarketplaceAnalyticsEvent {
  id: string
  store_id: string | null
  product_id: string | null
  visitor_id: string | null
  profile_id: string | null
  event_type: AnalyticsEventType
  metadata: Record<string, any>
  created_at: string
}

export interface StoreAnalyticsSummary {
  date: string
  views: number
  orders: number
  revenue: number
  cancellation_rate: number
  conversion_rate: number
}

export interface AdminLedgerSummary {
  total_volume: number
  total_platform_fees: number
  total_shipping_costs: number
  total_seller_earnings: number
  escrow_holding: number
  escrow_released: number
  escrow_refunded: number
  escrow_disputed: number
}

export interface RecordAnalyticsInput {
  storeId?: string
  productId?: string
  visitorId?: string
  profileId?: string
  eventType: AnalyticsEventType
  metadata?: Record<string, any>
}

// =========================================================
// 9. VIEW TYPES AND EXTRACORE TYPES
// =========================================================

export interface PostWithCounts {
  id: string
  author_id: string
  title: string | null
  content: string | null
  category: string | null
  location: string | null
  is_featured: boolean
  view_count: number
  created_at: string
  updated_at: string
  username: string
  full_name: string | null
  avatar_url: string | null
  verified: boolean
  author_location: string | null
  craft_category: string | null
  likes_count: number
  bookmarks_count: number
  tags: string[] | null
  cover_image: string | null
}

export interface GuideBooking {
  id: string
  tourist_id: string
  guide_id: string
  service_id: string | null
  date: string
  time: string | null
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  notes: string | null
  created_at: string
}

export interface AiConversation {
  id: string
  user_id: string
  messages: { role: 'user' | 'ai'; content: string }[]
  created_at: string
  updated_at: string
}


// =========================================================
// 10. SUPABASE COMPATIBLE DATABASE TYPES
// =========================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Partial<Profile> & Omit<Profile, 'id' | 'clerk_id' | 'username'> & { clerk_id: string; username: string }
        Update: Partial<Profile>
      }
      profile_verifications: {
        Row: ProfileVerification
        Insert: Partial<ProfileVerification> & Omit<ProfileVerification, 'id' | 'profile_id'> & { profile_id: string }
        Update: Partial<ProfileVerification>
      }
      audit_logs: {
        Row: AuditLog
        Insert: Partial<AuditLog>
        Update: Partial<AuditLog>
      }
      stores: {
        Row: Store
        Insert: Partial<Store> & Omit<Store, 'id' | 'owner_id' | 'name' | 'slug'> & { owner_id: string; name: string }
        Update: Partial<Store>
      }
      store_metrics: {
        Row: StoreMetric
        Insert: Partial<StoreMetric> & Omit<StoreMetric, 'id' | 'store_id'> & { store_id: string }
        Update: Partial<StoreMetric>
      }
      store_tiers: {
        Row: StoreTier
        Insert: Partial<StoreTier> & Omit<StoreTier, 'id' | 'name'> & { name: string }
        Update: Partial<StoreTier>
      }
      store_subscriptions: {
        Row: StoreSubscription
        Insert: Partial<StoreSubscription> & Omit<StoreSubscription, 'id' | 'store_id' | 'tier_id'> & { store_id: string; tier_id: string }
        Update: Partial<StoreSubscription>
      }
      onboarding_steps: {
        Row: OnboardingStep
        Insert: Partial<OnboardingStep> & Omit<OnboardingStep, 'id' | 'store_id'> & { store_id: string }
        Update: Partial<OnboardingStep>
      }
      profile_stats: {
        Row: ProfileStat
        Insert: Partial<ProfileStat> & Omit<ProfileStat, 'id' | 'profile_id'> & { profile_id: string }
        Update: Partial<ProfileStat>
      }
      specialties: {
        Row: Specialty
        Insert: Partial<Specialty> & Omit<Specialty, 'id' | 'profile_id'> & { profile_id: string }
        Update: Partial<Specialty>
      }
      services: {
        Row: Service
        Insert: Partial<Service> & Omit<Service, 'id' | 'profile_id'> & { profile_id: string }
        Update: Partial<Service>
      }
      posts: {
        Row: Post
        Insert: Partial<Post> & Omit<Post, 'id' | 'author_id'> & { author_id: string }
        Update: Partial<Post>
      }
      post_images: {
        Row: PostImage
        Insert: Partial<PostImage> & Omit<PostImage, 'id' | 'post_id' | 'url'> & { post_id: string; url: string }
        Update: Partial<PostImage>
      }
      post_tags: {
        Row: PostTag
        Insert: Partial<PostTag> & Omit<PostTag, 'id' | 'post_id' | 'tag'> & { post_id: string; tag: string }
        Update: Partial<PostTag>
      }
      likes: {
        Row: Like
        Insert: Partial<Like> & Omit<Like, 'id' | 'user_id' | 'post_id'> & { user_id: string; post_id: string }
        Update: Partial<Like>
      }
      bookmarks: {
        Row: Bookmark
        Insert: Partial<Bookmark> & Omit<Bookmark, 'id' | 'user_id' | 'post_id'> & { user_id: string; post_id: string }
        Update: Partial<Bookmark>
      }
      follows: {
        Row: Follow
        Insert: Partial<Follow> & Omit<Follow, 'id' | 'follower_id' | 'following_id'> & { follower_id: string; following_id: string }
        Update: Partial<Follow>
      }
      portfolio_items: {
        Row: PortfolioItem
        Insert: Partial<PortfolioItem> & Omit<PortfolioItem, 'id' | 'profile_id' | 'title'> & { profile_id: string; title: string }
        Update: Partial<PortfolioItem>
      }
      categories: {
        Row: Category
        Insert: Partial<Category> & Omit<Category, 'id' | 'name' | 'slug'> & { name: string; slug: string }
        Update: Partial<Category>
      }
      products: {
        Row: Product
        Insert: Partial<Product> & Omit<Product, 'id' | 'store_id' | 'name' | 'slug' | 'price' | 'stock'> & { store_id: string; name: string; price: number; stock: number }
        Update: Partial<Product>
      }
      product_variants: {
        Row: ProductVariant
        Insert: Partial<ProductVariant> & Omit<ProductVariant, 'id' | 'product_id' | 'name' | 'stock'> & { product_id: string; name: string; stock: number }
        Update: Partial<ProductVariant>
      }
      product_inventory: {
        Row: ProductInventory
        Insert: Partial<ProductInventory> & Omit<ProductInventory, 'id' | 'product_id'> & { product_id: string }
        Update: Partial<ProductInventory>
      }
      inventory_locks: {
        Row: InventoryLock
        Insert: Partial<InventoryLock> & Omit<InventoryLock, 'id' | 'checkout_id' | 'product_id' | 'quantity'> & { checkout_id: string; product_id: string; quantity: number }
        Update: Partial<InventoryLock>
      }
      experience_details: {
        Row: ExperienceDetails
        Insert: Partial<ExperienceDetails> & Omit<ExperienceDetails, 'id' | 'product_id'> & { product_id: string }
        Update: Partial<ExperienceDetails>
      }
      experience_slots: {
        Row: ExperienceSlot
        Insert: Partial<ExperienceSlot> & Omit<ExperienceSlot, 'id' | 'product_id' | 'date' | 'start_time'> & { product_id: string; date: string; start_time: string }
        Update: Partial<ExperienceSlot>
      }
      carts: {
        Row: Cart
        Insert: Partial<Cart>
        Update: Partial<Cart>
      }
      cart_items: {
        Row: CartItem
        Insert: Partial<CartItem> & Omit<CartItem, 'id' | 'cart_id' | 'product_id' | 'quantity' | 'price_at_add' | 'store_id'> & { cart_id: string; product_id: string; quantity: number; price_at_add: number; store_id: string }
        Update: Partial<CartItem>
      }
      coupons: {
        Row: Coupon
        Insert: Partial<Coupon> & Omit<Coupon, 'id' | 'code'> & { code: string }
        Update: Partial<Coupon>
      }
      checkout_sessions: {
        Row: CheckoutSession
        Insert: Partial<CheckoutSession> & Omit<CheckoutSession, 'id' | 'cart_id'> & { cart_id: string }
        Update: Partial<CheckoutSession>
      }
      abandoned_checkouts: {
        Row: AbandonedCheckout
        Insert: Partial<AbandonedCheckout> & Omit<AbandonedCheckout, 'id' | 'checkout_session_id'> & { checkout_session_id: string }
        Update: Partial<AbandonedCheckout>
      }
      parent_orders: {
        Row: ParentOrder
        Insert: Partial<ParentOrder>
        Update: Partial<ParentOrder>
      }
      child_orders: {
        Row: ChildOrder
        Insert: Partial<ChildOrder>
        Update: Partial<ChildOrder>
      }
      order_items: {
        Row: OrderItem
        Insert: Partial<OrderItem> & Omit<OrderItem, 'id' | 'child_order_id' | 'product_id' | 'quantity' | 'price_at_purchase'> & { child_order_id: string; product_id: string | null; quantity: number; price_at_purchase: number }
        Update: Partial<OrderItem>
      }
      order_history: {
        Row: OrderHistory
        Insert: Partial<OrderHistory> & Omit<OrderHistory, 'id' | 'child_order_id'> & { child_order_id: string }
        Update: Partial<OrderHistory>
      }
      order_disputes: {
        Row: OrderDispute
        Insert: Partial<OrderDispute> & Omit<OrderDispute, 'id' | 'child_order_id'> & { child_order_id: string }
        Update: Partial<OrderDispute>
      }
      transactions: {
        Row: Transaction
        Insert: Partial<Transaction>
        Update: Partial<Transaction>
      }
      escrow_ledgers: {
        Row: EscrowLedger
        Insert: Partial<EscrowLedger>
        Update: Partial<EscrowLedger>
      }
      seller_balances: {
        Row: SellerBalance
        Insert: Partial<SellerBalance> & Omit<SellerBalance, 'id' | 'store_id'> & { store_id: string }
        Update: Partial<SellerBalance>
      }
      payout_requests: {
        Row: PayoutRequest
        Insert: Partial<PayoutRequest> & Omit<PayoutRequest, 'id' | 'store_id'> & { store_id: string }
        Update: Partial<PayoutRequest>
      }
      commission_rules: {
        Row: CommissionRule
        Insert: Partial<CommissionRule>
        Update: Partial<CommissionRule>
      }
      refund_requests: {
        Row: RefundRequest
        Insert: Partial<RefundRequest> & Omit<RefundRequest, 'id' | 'child_order_id' | 'buyer_id'> & { child_order_id: string; buyer_id: string }
        Update: Partial<RefundRequest>
      }
      payment_methods: {
        Row: any
        Insert: any
        Update: any
      }
      shipping_zones: {
        Row: ShippingZone
        Insert: Partial<ShippingZone> & Omit<ShippingZone, 'id' | 'name' | 'type'> & { name: string; type: DeliveryType }
        Update: Partial<ShippingZone>
      }
      carrier_configs: {
        Row: CarrierConfig
        Insert: Partial<CarrierConfig> & Omit<CarrierConfig, 'id' | 'name' | 'code' | 'type'> & { name: string; code: string; type: DeliveryType }
        Update: Partial<CarrierConfig>
      }
      store_shipping_policies: {
        Row: StoreShippingPolicy
        Insert: Partial<StoreShippingPolicy> & Omit<StoreShippingPolicy, 'id' | 'store_id'> & { store_id: string }
        Update: Partial<StoreShippingPolicy>
      }
      store_shipping_rates: {
        Row: StoreShippingRate
        Insert: Partial<StoreShippingRate> & Omit<StoreShippingRate, 'id' | 'store_id' | 'zone_id'> & { store_id: string; zone_id: string }
        Update: Partial<StoreShippingRate>
      }
      pickup_hubs: {
        Row: PickupHub
        Insert: Partial<PickupHub> & Omit<PickupHub, 'id' | 'name' | 'address'> & { name: string; address: string }
        Update: Partial<PickupHub>
      }
      shipments: {
        Row: Shipment
        Insert: Partial<Shipment> & Omit<Shipment, 'id' | 'child_order_id'> & { child_order_id: string }
        Update: Partial<Shipment>
      }
      product_reviews: {
        Row: ProductReview
        Insert: Partial<ProductReview> & Omit<ProductReview, 'id' | 'child_order_id' | 'product_id' | 'buyer_id'> & { child_order_id: string; product_id: string; buyer_id: string }
        Update: Partial<ProductReview>
      }
      buyer_reviews: {
        Row: BuyerReview
        Insert: Partial<BuyerReview> & Omit<BuyerReview, 'id' | 'child_order_id' | 'seller_id' | 'buyer_id'> & { child_order_id: string; seller_id: string; buyer_id: string }
        Update: Partial<BuyerReview>
      }
      review_replies: {
        Row: any
        Insert: any
        Update: any
      }
      review_helpful_votes: {
        Row: any
        Insert: any
        Update: any
      }
      review_requests: {
        Row: any
        Insert: any
        Update: any
      }
      trust_scores: {
        Row: StoreTrustMetrics
        Insert: Partial<StoreTrustMetrics>
        Update: Partial<StoreTrustMetrics>
      }
      trust_badges: {
        Row: any
        Insert: any
        Update: any
      }
      notifications: {
        Row: any
        Insert: any
        Update: any
      }
      notification_preferences: {
        Row: any
        Insert: any
        Update: any
      }
      promoted_listings: {
        Row: any
        Insert: any
        Update: any
      }
      marketplace_analytics_events: {
        Row: MarketplaceAnalyticsEvent
        Insert: Partial<MarketplaceAnalyticsEvent>
        Update: Partial<MarketplaceAnalyticsEvent>
      }
      guide_bookings: {
        Row: GuideBooking
        Insert: Partial<GuideBooking> & Omit<GuideBooking, 'id' | 'tourist_id' | 'guide_id'> & { tourist_id: string; guide_id: string }
        Update: Partial<GuideBooking>
      }
      chat_threads: {
        Row: ChatThread
        Insert: Partial<ChatThread> & Omit<ChatThread, 'id' | 'buyer_id' | 'seller_id' | 'store_id'> & { buyer_id: string; seller_id: string; store_id: string }
        Update: Partial<ChatThread>
      }
      chat_messages: {
        Row: ChatMessage
        Insert: Partial<ChatMessage> & Omit<ChatMessage, 'id' | 'thread_id' | 'sender_id' | 'content'> & { thread_id: string; sender_id: string; content: string }
        Update: Partial<ChatMessage>
      }
    }
    Views: {
      posts_with_counts: {
        Row: PostWithCounts
      }
      full_profiles: {
        Row: any
      }
      stores_trust_metrics: {
        Row: StoreTrustMetrics
      }
    }
    Enums: {
      delivery_type: DeliveryType
      rate_type: RateType
      shipment_status: ShipmentStatus
      order_status: OrderStatus
    }
    Functions: {
      get_store_analytics_summary: {
        Args: { p_store_id: string; p_start_date: string; p_end_date: string }
        Returns: StoreAnalyticsSummary[]
      }
      get_admin_ledger_summary: {
        Args: { p_start_date: string; p_end_date: string }
        Returns: AdminLedgerSummary[]
      }
      increment_view_count: {
        Args: { p_post_id: string }
        Returns: void
      }
      toggle_like: {
        Args: { p_user_id: string; p_post_id: string }
        Returns: boolean
      }
      toggle_bookmark: {
        Args: { p_user_id: string; p_post_id: string }
        Returns: boolean
      }
      toggle_follow: {
        Args: { p_follower_id: string; p_following_id: string }
        Returns: boolean
      }
      is_username_available: {
        Args: { p_username: string }
        Returns: boolean
      }
    }
  }
}
