// Background Jobs: lib/shipping/jobs.ts
// Automated routines to sync carrier updates, issue collection warnings, and monitor exceptions.

import { createAdminClient } from '@/lib/supabase/admin';
import { pollCarrierUpdates } from '@/lib/shipping/tracker';
import { updateShipmentStatus } from '@/lib/db/shipping';

/**
 * Job 1: pollCarrierUpdates
 * Scheduled to run every 2 hours.
 * Connects to carriers and updates in-transit shipments.
 */
export async function runPollCarrierUpdates(): Promise<void> {
  try {
    console.log('🏁 Starting scheduled job: pollCarrierUpdates');
    await pollCarrierUpdates();
    console.log('✅ Completed scheduled job: pollCarrierUpdates');
  } catch (err: any) {
    console.error('🔴 Error running pollCarrierUpdates background job:', err.message);
  }
}

/**
 * Job 2: sendPickupReminders
 * Scheduled to run daily at 9am.
 * Scans hubs for packages awaiting collection and issues warnings on Day 3, 5, and 7.
 */
export async function sendPickupReminders(): Promise<void> {
  console.log('🏁 Starting scheduled job: sendPickupReminders');
  const supabase = await createAdminClient();

  // 1. Fetch shipments currently waiting at hubs ('out_for_delivery' represents waiting at hub)
  const { data: shipments, error } = await supabase
    .from('shipments')
    .select('*, pickup_hub:pickup_hubs(*)')
    .eq('status', 'out_for_delivery')
    .not('pickup_hub_id', 'is', null);

  if (error || !shipments || shipments.length === 0) {
    console.log('ℹ️ No shipments currently awaiting pickup at hubs.');
    return;
  }

  const now = new Date();

  for (const shipment of shipments) {
    const arrivalDate = new Date(shipment.updated_at);
    const diffTime = Math.abs(now.getTime() - arrivalDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Retrieve order and buyer contact details
    const { data: order } = await supabase
      .from('child_orders')
      .select('id, store_id, parent_orders(buyer_id, profiles!parent_orders_buyer_id_fkey(email, full_name))')
      .eq('id', shipment.child_order_id)
      .single();

    if (!order || !(order as any).parent_orders) continue;

    const buyer: any = (order as any).parent_orders.profiles;
    const hub = shipment.pickup_hub;

    if (diffDays === 3 || diffDays === 5) {
      console.log(`✉️ Reminder (Day ${diffDays}) sent to ${buyer?.email}: ` +
        `Your package is waiting at ${hub?.name}. Please collect it soon!`);
    } else if (diffDays === 7) {
      console.log(`⚠️ Final Warning (Day 7) sent to ${buyer?.email}: ` +
        `Your package at ${hub?.name} has reached its storage limit and may be returned.`);
    } else if (diffDays > 7) {
      // Notify seller that the buyer has failed to collect within the storage window
      const { data: store } = await supabase
        .from('stores')
        .select('profiles!stores_owner_id_fkey(email)')
        .eq('id', order.store_id)
        .single();

      if (store && store.profiles) {
        const seller: any = store.profiles;
        console.log(`✉️ Notice sent to Seller ${seller?.email}: ` +
          `Order #${shipment.child_order_id} has exceeded the 7-day pickup limit. Contacting buyer or scheduling return.`);
      }
    }
  }

  console.log('✅ Completed scheduled job: sendPickupReminders');
}

/**
 * Job 3: autoMarkDelivered & Exception Monitors
 * Scheduled to run every 6 hours.
 * Monitors domestic deliveries that have exceeded reasonable timeframes without tracking updates.
 */
export async function autoMarkDelivered(): Promise<void> {
  console.log('🏁 Starting scheduled job: autoMarkDelivered');
  const supabase = await createAdminClient();

  const now = new Date();
  const thresholdDays = 10;
  const exceptionCutoff = new Date();
  exceptionCutoff.setDate(now.getDate() - thresholdDays);

  // 1. Fetch national shipments shipped over 10 days ago which are still active
  const { data: activeShipments, error } = await supabase
    .from('shipments')
    .select('*')
    .eq('type', 'national')
    .not('status', 'in', '("delivered","returned","failed_delivery")')
    .lt('shipped_at', exceptionCutoff.toISOString());

  if (error || !activeShipments || activeShipments.length === 0) {
    console.log('ℹ️ No active national shipments exceeding delivery limits.');
    return;
  }

  console.log(`⚠️ Flagging ${activeShipments.length} stale national shipments for manual operations review...`);

  for (const shipment of activeShipments) {
    // Append exception audit to the timeline, keeping tracking active for administrative checkup
    await updateShipmentStatus(shipment.id, shipment.status, {
      status: shipment.status,
      location: shipment.destination_address?.city || 'Destination City',
      description: `[System Operations Review] Shipment has exceeded ${thresholdDays} days in-transit without status updates.`
    });

    // Notify administrators of potential lost package exception
    const { data: admins } = await supabase
      .from('profiles')
      .select('email')
      .eq('role', 'admin');

    if (admins && admins.length > 0) {
      console.log(`🚨 Lost Package Alarm sent to Platform Admin (${admins[0].email}): ` +
        `National order #${shipment.child_order_id} is stale! Failsafe review required.`);
    }
  }

  console.log('✅ Completed scheduled job: autoMarkDelivered');
}
