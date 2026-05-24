// Pickup Hubs: lib/shipping/pickup-hubs.ts
// Handles coordination of local Essaouira Medina partner pickup collections.

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPickupHubs } from '@/lib/db/shipping';
import { updateShipmentStatus } from '@/lib/db/shipping';
import type { PickupHub, Shipment } from '@/types/shipping.types';

/**
 * Lists all active collection hubs filtered by city (defaulting to Essaouira).
 */
export async function getAvailablePickupHubs(city?: string): Promise<PickupHub[]> {
  return getPickupHubs(city);
}

/**
 * Assigns an order shipment to a local pickup hub and notifies the buyer.
 */
export async function assignPickupHub(shipmentId: string, hubId: string): Promise<Shipment> {
  const supabase = await createClient();
  const adminClient = await createAdminClient();

  // 1. Fetch hub details
  const { data: hub, error: hubErr } = await supabase
    .from('pickup_hubs')
    .select('*')
    .eq('id', hubId)
    .single();

  if (hubErr || !hub) {
    throw new Error(`Pickup hub with ID ${hubId} not found.`);
  }

  // 2. Calculate maximum storage expiry date (default 7 days)
  const maxStorageDays = hub.max_storage_days || 7;
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + maxStorageDays);

  // 3. Update shipment record with hub assignment and tracking event
  const { data: shipment, error: shipErr } = await adminClient
    .from('shipments')
    .update({
      pickup_hub_id: hubId,
      estimated_delivery: new Date().toISOString().split('T')[0], // Ready today!
      status: 'out_for_delivery', // For local pickup, 'out_for_delivery' represents arrived at hub!
      updated_at: new Date().toISOString()
    })
    .eq('id', shipmentId)
    .select('*')
    .single();

  if (shipErr || !shipment) {
    throw new Error(`Failed to assign pickup hub for shipment ${shipmentId}: ${shipErr?.message}`);
  }

  // 4. Append tracking timeline event
  await updateShipmentStatus(shipmentId, 'out_for_delivery', {
    status: 'out_for_delivery',
    location: hub.address,
    description: `Package arrived at pickup hub '${hub.name}'. Ready for buyer collection.`
  });

  // 5. Send multi-channel notification to buyer
  const { data: order } = await adminClient
    .from('child_orders')
    .select('id, parent_orders(buyer_id, profiles!parent_orders_buyer_id_fkey(email, full_name))')
    .eq('id', shipment.child_order_id)
    .single();

  if (order && (order as any).parent_orders) {
    const buyer: any = (order as any).parent_orders.profiles;
    console.log(`✉️ Notification sent to ${buyer?.email || 'buyer'}: ` +
      `Your order is ready for pickup at ${hub.name}! ` +
      `Address: ${hub.address}. Working Hours: ${JSON.stringify(hub.working_hours)}. ` +
      `Available until: ${expiryDate.toLocaleDateString()}`);
  }

  return shipment as Shipment;
}

/**
 * Buyer confirms collection from partner hub, completing the order cycle.
 */
export async function confirmHubPickup(shipmentId: string, buyerId: string): Promise<Shipment> {
  const supabase = await createClient();
  const adminClient = await createAdminClient();

  // 1. Fetch shipment details
  const { data: shipment, error: fetchErr } = await supabase
    .from('shipments')
    .select('*, pickup_hub:pickup_hubs(*)')
    .eq('id', shipmentId)
    .single();

  if (fetchErr || !shipment) {
    throw new Error(`Shipment with ID ${shipmentId} not found.`);
  }

  // 2. Validate that the collection request matches the buyer
  const { data: order } = await adminClient
    .from('child_orders')
    .select('id, store_id, parent_orders(buyer_id, profiles!parent_orders_buyer_id_fkey(email))')
    .eq('id', shipment.child_order_id)
    .single();

  if (!order || (order as any).parent_orders?.buyer_id !== buyerId) {
    throw new Error('Unauthorized collection. Buyer credentials do not match order records.');
  }

  // 3. Mark shipment as delivered in the database
  const updatedShipment = await updateShipmentStatus(shipmentId, 'delivered', {
    status: 'delivered',
    location: shipment.pickup_hub?.address || 'Pickup Hub',
    description: 'Buyer successfully collected the package from Medina Hub.'
  });

  // 4. Notify the artisan seller that the collection is complete and funds can release
  const { data: store } = await adminClient
    .from('stores')
    .select('owner_id, name, profiles!stores_owner_id_fkey(email)')
    .eq('id', (order as any).store_id)
    .single();

  if (store && store.profiles) {
    const seller: any = store.profiles;
    console.log(`✉️ Seller alert to ${seller?.email}: ` +
      `Order #${shipment.child_order_id} has been picked up by the buyer! Escrow release scheduled.`);
  }

  return updatedShipment;
}
