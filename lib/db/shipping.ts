// Database Helpers: lib/db/shipping.ts
// Handles database CRUD operations for the multi-vendor Shipping & Delivery System.

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { 
  StoreShippingPolicy, 
  StoreShippingRate, 
  Shipment, 
  PickupHub,
  CreateShipmentInput,
  UpdateTrackingInput,
  ShipmentStatus
} from '@/types/shipping.types';

/**
 * Fetches the shipping policy for a specific store.
 */
export async function getStoreShippingPolicy(storeId: string): Promise<StoreShippingPolicy | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('store_shipping_policies')
    .select('*')
    .eq('store_id', storeId)
    .maybeSingle();

  if (error) {
    console.error('🔴 Error in getStoreShippingPolicy:', error);
    throw new Error(`Failed to retrieve shipping policy for store ${storeId}`);
  }

  return data as StoreShippingPolicy | null;
}

/**
 * Updates a store's shipping policy. If it does not exist, it will be automatically created (upsert).
 */
export async function updateStoreShippingPolicy(
  storeId: string, 
  data: Partial<Omit<StoreShippingPolicy, 'id' | 'store_id' | 'created_at' | 'updated_at'>>
): Promise<StoreShippingPolicy> {
  const supabase = await createClient();
  
  // Format coordinate PostGIS points if provided as { x, y } (longitude, latitude)
  const payload: any = { ...data };
  if (data.ships_from_coords && typeof data.ships_from_coords === 'object') {
    const { x, y } = data.ships_from_coords as { x: number; y: number };
    payload.ships_from_coords = `SRID=4326;POINT(${x} ${y})`;
  }
  if (data.local_pickup_coords && typeof data.local_pickup_coords === 'object') {
    const { x, y } = data.local_pickup_coords as { x: number; y: number };
    payload.local_pickup_coords = `SRID=4326;POINT(${x} ${y})`;
  }

  const { data: updated, error } = await supabase
    .from('store_shipping_policies')
    .upsert({
      store_id: storeId,
      ...payload,
      updated_at: new Date().toISOString()
    }, { onConflict: 'store_id' })
    .select('*')
    .single();

  if (error) {
    console.error('🔴 Error in updateStoreShippingPolicy:', error);
    throw new Error(`Failed to update shipping policy for store ${storeId}: ${error.message}`);
  }

  return updated as StoreShippingPolicy;
}

/**
 * Fetches all configured shipping rates for a specific store.
 */
export async function getStoreShippingRates(storeId: string): Promise<StoreShippingRate[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('store_shipping_rates')
    .select('*, zone:shipping_zones(*), carrier:carrier_configs(*)')
    .eq('store_id', storeId)
    .eq('is_active', true);

  if (error) {
    console.error('🔴 Error in getStoreShippingRates:', error);
    throw new Error(`Failed to retrieve shipping rates for store ${storeId}`);
  }

  return data as any[];
}

/**
 * Upserts a shipping rate tier for a store in a specific zone.
 */
export async function upsertShippingRate(
  storeId: string,
  zoneId: string,
  data: Omit<StoreShippingRate, 'id' | 'store_id' | 'zone_id' | 'created_at' | 'updated_at'>
): Promise<StoreShippingRate> {
  const supabase = await createClient();
  
  const { data: upserted, error } = await supabase
    .from('store_shipping_rates')
    .upsert({
      store_id: storeId,
      zone_id: zoneId,
      carrier_id: data.carrier_id,
      rate_type: data.rate_type,
      flat_fee: data.flat_fee,
      weight_tiers: data.weight_tiers,
      min_order_mad: data.min_order_mad,
      max_order_mad: data.max_order_mad,
      is_active: data.is_active,
      updated_at: new Date().toISOString()
    }, { onConflict: 'store_id,zone_id' })
    .select('*')
    .single();

  if (error) {
    console.error('🔴 Error in upsertShippingRate:', error);
    throw new Error(`Failed to upsert shipping rate: ${error.message}`);
  }

  return upserted as StoreShippingRate;
}

/**
 * Creates a new shipment linked to a child order.
 */
export async function createShipment(
  childOrderId: string,
  data: CreateShipmentInput
): Promise<Shipment> {
  const supabase = await createClient();

  // Resolve tracking URL if template exists for carrier
  let trackingUrl = null;
  if (data.carrierId && data.trackingNumber) {
    const { data: carrier } = await supabase
      .from('carrier_configs')
      .select('tracking_url_template')
      .eq('id', data.carrierId)
      .maybeSingle();

    if (carrier?.tracking_url_template) {
      trackingUrl = carrier.tracking_url_template.replace('{tracking_number}', data.trackingNumber);
    }
  }

  const { data: shipment, error } = await supabase
    .from('shipments')
    .insert({
      child_order_id: childOrderId,
      carrier_id: data.carrierId,
      type: data.type,
      tracking_number: data.trackingNumber || null,
      tracking_url: trackingUrl,
      shipping_label_url: data.shippingLabelUrl || null,
      pickup_hub_id: data.pickupHubId || null,
      origin_address: data.originAddress,
      destination_address: data.destinationAddress,
      weight_grams: data.weightGrams,
      dimensions: data.dimensions,
      declared_value: data.declaredValue,
      customs_description: data.customsDescription || null,
      estimated_delivery: data.estimatedDelivery || null,
      shipped_at: data.trackingNumber ? new Date().toISOString() : null,
      status: data.trackingNumber ? 'picked_up' : 'label_created',
      tracking_events: data.trackingNumber 
        ? [
            {
              status: 'picked_up' as ShipmentStatus,
              location: data.originAddress.city || 'Essaouira',
              timestamp: new Date().toISOString(),
              description: 'Shipment has been picked up by the courier.'
            }
          ]
        : [
            {
              status: 'label_created' as ShipmentStatus,
              location: data.originAddress.city || 'Essaouira',
              timestamp: new Date().toISOString(),
              description: 'Shipping label created. Awaiting package collection.'
            }
          ],
      updated_at: new Date().toISOString()
    })
    .select('*')
    .single();

  if (error) {
    console.error('🔴 Error in createShipment:', error);
    throw new Error(`Failed to create shipment for order ${childOrderId}: ${error.message}`);
  }

  return shipment as Shipment;
}

/**
 * Retrieves shipment by child order ID.
 */
export async function getShipmentByOrder(childOrderId: string): Promise<Shipment | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('shipments')
    .select('*, carrier:carrier_configs(*), pickup_hub:pickup_hubs(*)')
    .eq('child_order_id', childOrderId)
    .maybeSingle();

  if (error) {
    console.error('🔴 Error in getShipmentByOrder:', error);
    throw new Error(`Failed to retrieve shipment for order ${childOrderId}`);
  }

  return data as any | null;
}

/**
 * Retrieves shipment by carrier tracking number.
 */
export async function getShipmentByTracking(trackingNumber: string): Promise<Shipment | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('shipments')
    .select('*, carrier:carrier_configs(*), pickup_hub:pickup_hubs(*)')
    .eq('tracking_number', trackingNumber)
    .maybeSingle();

  if (error) {
    console.error('🔴 Error in getShipmentByTracking:', error);
    throw new Error(`Failed to retrieve shipment with tracking ${trackingNumber}`);
  }

  return data as any | null;
}

/**
 * Appends a tracking event and transitions the shipment status.
 */
export async function updateShipmentStatus(
  id: string,
  status: ShipmentStatus,
  event: UpdateTrackingInput
): Promise<Shipment> {
  const supabase = await createAdminClient(); // Bypasses RLS to write system tracking logs

  // 1. Fetch current tracking events
  const { data: current, error: fetchErr } = await supabase
    .from('shipments')
    .select('tracking_events, status')
    .eq('id', id)
    .single();

  if (fetchErr || !current) {
    throw new Error(`Shipment with ID ${id} not found.`);
  }

  const events = Array.isArray(current.tracking_events) ? [...current.tracking_events] : [];
  
  // 2. Append new event
  events.push({
    status: event.status,
    location: event.location,
    timestamp: event.timestamp || new Date().toISOString(),
    description: event.description
  });

  // 3. Update shipment record
  const updatePayload: any = {
    status,
    tracking_events: events,
    updated_at: new Date().toISOString()
  };

  if (status === 'delivered') {
    updatePayload.delivered_at = new Date().toISOString();
  }

  const { data: updated, error: updateErr } = await supabase
    .from('shipments')
    .update(updatePayload)
    .eq('id', id)
    .select('*')
    .single();

  if (updateErr) {
    console.error('🔴 Error in updateShipmentStatus:', updateErr);
    throw new Error(`Failed to update shipment status for ${id}`);
  }

  return updated as Shipment;
}

/**
 * Retrieves all currently in-transit or active shipments (non-terminal states).
 */
export async function getActiveShipments(): Promise<Shipment[]> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('shipments')
    .select('*, carrier:carrier_configs(*)')
    .not('status', 'in', '("delivered","returned","failed_delivery")');

  if (error) {
    console.error('🔴 Error in getActiveShipments:', error);
    throw new Error('Failed to retrieve active shipments.');
  }

  return data as any[];
}

/**
 * Retrieves available partner pickup hubs.
 */
export async function getPickupHubs(city?: string): Promise<PickupHub[]> {
  const supabase = await createClient();
  let query = supabase.from('pickup_hubs').select('*').eq('is_active', true);
  
  if (city) {
    query = query.ilike('city', city.trim());
  }

  const { data, error } = await query;
  if (error) {
    console.error('🔴 Error in getPickupHubs:', error);
    throw new Error('Failed to retrieve pickup hubs.');
  }

  return data as PickupHub[];
}
