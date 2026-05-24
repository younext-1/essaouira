import { createClient } from '@/lib/supabase/server'
import { OrderStatus } from '../../types/orders.types'

export interface NotificationPayload {
  childOrderId: string;
  buyerId?: string | null;
  storeId?: string | null;
  trackingNumber?: string | null;
  carrier?: string | null;
  notes?: string;
}

/**
 * Dispatches multi-channel notifications (email, SMS, in-app logs) depending on the order status change.
 */
export async function dispatchNotification(
  status: OrderStatus,
  data: NotificationPayload
): Promise<void> {
  const supabase = await createClient();

  // 1. Fetch contact info for buyer
  let buyerEmail = 'buyer@marketplace.com';
  let buyerPhone = '+212600000000';
  let buyerName = 'Buyer';

  if (data.buyerId) {
    const { data: buyerProfile } = await supabase
      .from('profiles')
      .select('email, phone, full_name')
      .eq('id', data.buyerId)
      .maybeSingle();

    if (buyerProfile) {
      buyerEmail = buyerProfile.email || buyerEmail;
      buyerPhone = buyerProfile.phone || buyerPhone;
      buyerName = buyerProfile.full_name || buyerName;
    }
  }

  // 2. Fetch contact info for seller/store owner
  let sellerEmail = 'artisan@marketplace.com';
  let sellerPhone = '+212611111111';
  let sellerName = 'Artisan';
  let storeName = 'Artisan Store';

  if (data.storeId) {
    const { data: store } = await supabase
      .from('stores')
      .select('name, phone, owner_id')
      .eq('id', data.storeId)
      .maybeSingle();

    if (store) {
      storeName = store.name;
      sellerPhone = store.phone || sellerPhone;
      
      if (store.owner_id) {
        const { data: ownerProfile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', store.owner_id)
          .maybeSingle();

        if (ownerProfile) {
          sellerEmail = ownerProfile.email || sellerEmail;
          sellerName = ownerProfile.full_name || sellerName;
        }
      }
    }
  }

  const logNotification = (
    channel: 'email' | 'sms' | 'in_app',
    recipient: string,
    message: string
  ) => {
    console.log(`[NOTIFICATION] [${channel.toUpperCase()}] to [${recipient}]: "${message}"`);
  };

  // 3. Dispatch status-based notification flows
  switch (status) {
    case 'pending':
      // Seller Alert (SMS + Email + In-App)
      logNotification('sms', sellerPhone, `New order received in ${storeName}! Please confirm within 48h to avoid automatic cancellation.`);
      logNotification('email', sellerEmail, `Dear ${sellerName},\n\nYou have received a new order for "${storeName}". Please review and confirm within 48 hours.\n\nOrder ID: ${data.childOrderId}`);
      logNotification('in_app', sellerEmail, `New order received — confirm within 48h! Order ID: ${data.childOrderId}`);

      // Buyer Alert (Email + In-App)
      logNotification('email', buyerEmail, `Dear ${buyerName},\n\nYour order has been placed successfully. Store "${storeName}" is reviewing it.\n\nOrder ID: ${data.childOrderId}`);
      logNotification('in_app', buyerEmail, `Order placed successfully! Order ID: ${data.childOrderId}`);
      break;

    case 'confirmed':
      // Buyer Alert (In-App)
      logNotification('in_app', buyerEmail, `Your order for "${storeName}" has been confirmed by the seller!`);
      break;

    case 'processing':
      // Buyer Alert (In-App)
      logNotification('in_app', buyerEmail, `Your order for "${storeName}" is now being prepared/processed.`);
      break;

    case 'shipped':
      // Buyer Alert (Email + In-App)
      logNotification('email', buyerEmail, `Dear ${buyerName},\n\nGood news! Your order from "${storeName}" has been shipped.\n\nTracking Number: ${data.trackingNumber || 'N/A'}\nCarrier: ${data.carrier || 'Standard Courier'}`);
      logNotification('in_app', buyerEmail, `Your order has shipped! Tracking: ${data.trackingNumber || 'N/A'}`);
      break;

    case 'out_for_delivery':
      // Buyer Alert (SMS + In-App)
      logNotification('sms', buyerPhone, `Your order from "${storeName}" is out for delivery today! Keep your phone active.`);
      logNotification('in_app', buyerEmail, `Your order is out for delivery today!`);
      break;

    case 'delivered':
      // Buyer Alert (Email + In-App)
      logNotification('email', buyerEmail, `Dear ${buyerName},\n\nYour order from "${storeName}" has been delivered! Please confirm delivery in your account to release payment to the seller.`);
      logNotification('in_app', buyerEmail, `Confirm delivery to release payment to store "${storeName}".`);
      break;

    case 'completed':
      // Seller Alert (Email + In-App)
      logNotification('email', sellerEmail, `Dear ${sellerName},\n\nGreat news! The buyer confirmed receipt. Payment has been released to your available balance.`);
      logNotification('in_app', sellerEmail, `Payment released to your available balance for Order ID: ${data.childOrderId}`);

      // Buyer Alert (In-App)
      logNotification('in_app', buyerEmail, `Order completed! Please leave a review for your purchase from "${storeName}".`);
      break;

    case 'cancelled':
      // Buyer Alert (Email)
      logNotification('email', buyerEmail, `Dear ${buyerName},\n\nYour order from "${storeName}" has been cancelled. If any payment was made, a refund has been initiated.`);

      // Seller Alert (In-App)
      logNotification('in_app', sellerEmail, `Order ID ${data.childOrderId} has been cancelled.`);
      break;

    case 'refund_requested':
      // Seller Alert (Email + In-App)
      logNotification('email', sellerEmail, `Dear ${sellerName},\n\nThe buyer has opened a refund request on Order ID: ${data.childOrderId}. Please respond within 48h.`);
      logNotification('in_app', sellerEmail, `Buyer requested refund — respond within 48h!`);

      // Admin Alert (In-App)
      logNotification('in_app', 'admin@marketplace.com', `New refund request opened by buyer on child order: ${data.childOrderId}`);
      break;

    case 'refunded':
      // Buyer Alert (Email)
      logNotification('email', buyerEmail, `Dear ${buyerName},\n\nYour refund request for order from "${storeName}" has been approved and completed successfully.`);
      break;

    default:
      console.log(`[NOTIFICATION] Status transition triggered for: ${status}. No email/sms configured.`);
      break;
  }
}
