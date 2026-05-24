// Shipping Calculator: lib/shipping/calculator.ts
// Algorithms and lookups to determine exact shipping fees across multiple stores.

import { createClient } from '@/lib/supabase/server';
import { getStoreShippingPolicy, getPickupHubs } from '@/lib/db/shipping';
import type { 
  ShippingZone, 
  StoreShippingRate, 
  PickupHub, 
  ShippingCalculation, 
  WeightTier 
} from '@/types/shipping.types';

interface AddressInput {
  city: string;
  country: string;
  postalCode?: string;
}

/**
 * Calculates volumetric weight of a product based on length, width, and height.
 * Formula: (length_cm * width_cm * height_cm) / 5000.
 * Returns the maximum between actual weight and volumetric weight.
 */
export function calculateVolumetricWeight(
  actualWeightGrams: number,
  dimensions?: { length_cm: number; width_cm: number; height_cm: number } | null
): number {
  if (!dimensions || !dimensions.length_cm || !dimensions.width_cm || !dimensions.height_cm) {
    return actualWeightGrams;
  }
  
  const volumetricGrams = (dimensions.length_cm * dimensions.width_cm * dimensions.height_cm / 5000) * 1000;
  return Math.max(actualWeightGrams, Math.round(volumetricGrams));
}

/**
 * Detects the matching shipping zone based on the destination address.
 */
export async function detectShippingZone(address: AddressInput): Promise<ShippingZone> {
  const supabase = await createClient();
  const country = (address.country || '').trim().toUpperCase();
  const city = (address.city || '').trim().toLowerCase();

  // Determine delivery zone type
  let detectedType: 'local' | 'national' | 'international' = 'international';
  if (country === 'MA' || country === 'MOROCCO' || country === 'MAROC') {
    detectedType = city === 'essaouira' ? 'local' : 'national';
  }

  // 1. Attempt to find an active custom zone in the DB matching the type and filtering countries/cities
  const { data: zones, error } = await supabase
    .from('shipping_zones')
    .select('*')
    .eq('type', detectedType)
    .eq('is_active', true);

  if (error) {
    console.error('🔴 Error fetching shipping zones:', error);
  }

  if (zones && zones.length > 0) {
    // If multiple zones exist, filter the most specific match
    if (detectedType === 'local') {
      const match = zones.find(z => !z.cities || z.cities.some((c: string) => c.toLowerCase() === 'essaouira'));
      if (match) return match as ShippingZone;
    } else if (detectedType === 'national') {
      const match = zones.find(z => !z.cities || z.cities.some((c: string) => c.toLowerCase() === city));
      if (match) return match as ShippingZone;
    } else {
      const match = zones.find(z => !z.countries || z.countries.some((c: string) => c.toUpperCase() === country));
      if (match) return match as ShippingZone;
    }
    return zones[0] as ShippingZone;
  }

  // 2. Fallback to inserting/returning a default active zone if none exists in the DB
  const { data: defaultZone, error: createError } = await supabase
    .from('shipping_zones')
    .insert({
      name: `${detectedType.toUpperCase()} Standard Zone`,
      type: detectedType,
      countries: detectedType === 'international' ? [country] : ['MA'],
      cities: detectedType === 'local' ? ['Essaouira'] : null,
      is_active: true
    })
    .select('*')
    .single();

  if (createError) {
    console.error('🔴 Failed to provision default shipping zone:', createError);
    // Absolute runtime fallback in case DB write fails
    return {
      id: '00000000-0000-0000-0000-000000000000',
      name: `${detectedType.toUpperCase()} Fallback Zone`,
      type: detectedType,
      countries: null,
      cities: null,
      is_active: true,
      created_at: new Date().toISOString()
    };
  }

  return defaultZone as ShippingZone;
}

/**
 * Estimates customs duties and taxes for international orders.
 * Warns the buyer about potential import fees.
 */
export function estimateCustomsDuty(
  items: Array<{ price: number; quantity: number; product: { category?: string } }>,
  destinationCountry: string
): { estimatedRangeMin: number; estimatedRangeMax: number; warningMessage: string } | null {
  const country = destinationCountry.trim().toUpperCase();
  if (country === 'MA' || country === 'MOROCCO') {
    return null; // Domestic Moroccan shipments carry zero custom duties
  }

  const totalValue = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  // Custom duty percentage estimates (10% to 25% of product values depending on global bounds)
  const rateMin = 0.12;
  const rateMax = 0.22;

  const estMin = Math.round(totalValue * rateMin * 100) / 100;
  const estMax = Math.round(totalValue * rateMax * 100) / 100;

  // Converts MAD to EUR/USD standard roughly (1 EUR ≈ 10.8 MAD)
  const minEur = Math.round((estMin / 10.8) * 100) / 100;
  const maxEur = Math.round((estMax / 10.8) * 100) / 100;

  return {
    estimatedRangeMin: minEur,
    estimatedRangeMax: maxEur,
    warningMessage: `Customs fees may apply for shipments to ${destinationCountry}. Estimated: ${minEur} - ${maxEur} EUR`
  };
}

/**
 * Calculates shipping cost for a specific store's items to a destination address.
 */
export async function calculateStoreShipping(
  storeId: string,
  items: any[],
  destinationAddress: AddressInput
): Promise<ShippingCalculation> {
  const supabase = await createClient();

  // 1. Fetch Store Policy
  const policy = await getStoreShippingPolicy(storeId);
  if (!policy) {
    throw new Error(`Store shipping policy not found for store ${storeId}`);
  }

  // 2. Detect Shipping Zone
  const zone = await detectShippingZone(destinationAddress);
  
  // Validate that the store supports this zone
  if (zone.type === 'local' && !policy.offers_local_pickup && !policy.offers_national) {
    throw new Error('Local pickup or delivery is not offered by this store.');
  }
  if (zone.type === 'national' && !policy.offers_national) {
    throw new Error('Store does not offer national delivery outside of Essaouira.');
  }
  if (zone.type === 'international' && !policy.offers_international) {
    throw new Error('Store does not support international shipping.');
  }

  // 3. Compute Item Metrics (Actual vs. Volumetric Weights)
  let totalWeightGrams = 0;
  let subtotal = 0;
  
  for (const item of items) {
    const qty = item.quantity;
    const price = item.variant?.price_override !== undefined && item.variant.price_override !== null
      ? Number(item.variant.price_override)
      : Number(item.product.price);
    
    subtotal += price * qty;

    const actualWeight = item.product.weight_grams ? Number(item.product.weight_grams) : 500; // Default 500g
    const dimensions = item.product.dimensions || null; // e.g. { length_cm, width_cm, height_cm }
    
    // Apply volumetric calculation for international shipments
    const itemWeight = zone.type === 'international' 
      ? calculateVolumetricWeight(actualWeight, dimensions) 
      : actualWeight;

    totalWeightGrams += itemWeight * qty;
  }

  // 4. Resolve Shipping Rate from store_shipping_rates
  const { data: rate, error: rateErr } = await supabase
    .from('store_shipping_rates')
    .select('*, carrier:carrier_configs(*)')
    .eq('store_id', storeId)
    .eq('zone_id', zone.id)
    .eq('is_active', true)
    .maybeSingle();

  let calculatedFee = 0;
  let carrier = null;
  let daysMin = 2;
  let daysMax = 5;

  if (rate) {
    carrier = rate.carrier ? {
      id: rate.carrier.id,
      name: rate.carrier.name,
      logo: rate.carrier.logo_url,
      estimatedDays: `${rate.carrier.estimated_days_min}-${rate.carrier.estimated_days_max} days`
    } : null;

    if (rate.carrier) {
      daysMin = rate.carrier.estimated_days_min;
      daysMax = rate.carrier.estimated_days_max;
    }

    if (rate.rate_type === 'free') {
      calculatedFee = 0;
    } else if (rate.rate_type === 'flat') {
      calculatedFee = Number(rate.flat_fee || 0);
    } else if (rate.rate_type === 'weight_based') {
      const tiers = (rate.weight_tiers as WeightTier[]) || [];
      // Sort tiers ascending by maximum weight threshold
      const sortedTiers = [...tiers].sort((a, b) => a.max_weight_g - b.max_weight_g);
      
      // Find matching tier
      const matchingTier = sortedTiers.find(tier => totalWeightGrams <= tier.max_weight_g);
      if (matchingTier) {
        calculatedFee = Number(matchingTier.fee);
      } else if (sortedTiers.length > 0) {
        // Exceeds heaviest tier, use the highest tier's fee as base + extra weight penalty
        const highestTier = sortedTiers[sortedTiers.length - 1];
        const extraWeightKg = Math.max(0, (totalWeightGrams - highestTier.max_weight_g) / 1000);
        calculatedFee = Number(highestTier.fee) + Math.round(extraWeightKg * 10.00); // 10 MAD penalty per extra kg
      } else {
        calculatedFee = 35.00; // General domestic fallback fee
      }
    }
  } else {
    // 5. Fallback defaults if the artisan did not configure shipping rates yet
    if (zone.type === 'local') {
      calculatedFee = Number(policy.local_pickup_fee || 0);
      daysMin = 1;
      daysMax = 2;
    } else if (zone.type === 'national') {
      calculatedFee = 35.00; // National Morocco Amana parcel fee
      daysMin = 2;
      daysMax = 4;
    } else {
      calculatedFee = 150.00; // International courier standard rate
      daysMin = 5;
      daysMax = 10;
    }
  }

  // 6. Apply store free shipping threshold overrides
  let isFree = false;
  let freeThresholdRemaining = null;

  if (policy.free_shipping_threshold_mad !== null && policy.free_shipping_threshold_mad !== undefined) {
    const threshold = Number(policy.free_shipping_threshold_mad);
    if (subtotal >= threshold) {
      calculatedFee = 0;
      isFree = true;
    } else {
      freeThresholdRemaining = Math.max(0, threshold - subtotal);
    }
  }

  // 7. Calculate estimated delivery range
  const handling = policy.handling_time_days || 1;
  const totalMinDays = handling + daysMin;
  const totalMaxDays = handling + daysMax;

  const today = new Date();
  const minDeliveryDate = new Date();
  minDeliveryDate.setDate(today.getDate() + totalMinDays);
  
  const maxDeliveryDate = new Date();
  maxDeliveryDate.setDate(today.getDate() + totalMaxDays);

  // 8. Resolve Local Pickup Hub Options
  let pickupOptions: PickupHub[] | null = null;
  if (zone.type === 'local' && policy.offers_local_pickup) {
    pickupOptions = await getPickupHubs('Essaouira');
  }

  // 9. Estimate international custom duties if shipping overseas
  const customs = estimateCustomsDuty(items, destinationAddress.country);

  return {
    storeId,
    type: zone.type as any,
    carrier,
    fee: Math.round(calculatedFee * 100) / 100,
    isFree,
    freeThresholdRemaining: freeThresholdRemaining ? Math.round(freeThresholdRemaining * 100) / 100 : null,
    estimatedDeliveryRange: {
      min: minDeliveryDate.toISOString().split('T')[0],
      max: maxDeliveryDate.toISOString().split('T')[0]
    },
    pickupOptions,
    customsDutyEstimate: customs
  };
}

/**
 * Calculates cart shipping cost split by store storefronts.
 */
export async function calculateCartShipping(
  items: any[],
  destinationAddress: AddressInput
): Promise<{ stores: ShippingCalculation[]; totalShipping: number }> {
  // Group items by store_id
  const storeGroups: Record<string, any[]> = {};
  for (const item of items) {
    const storeId = item.store_id;
    if (!storeGroups[storeId]) {
      storeGroups[storeId] = [];
    }
    storeGroups[storeId].push(item);
  }

  const calcs: ShippingCalculation[] = [];
  let totalShipping = 0;

  for (const [storeId, storeItems] of Object.entries(storeGroups)) {
    const calc = await calculateStoreShipping(storeId, storeItems, destinationAddress);
    calcs.push(calc);
    totalShipping += calc.fee ?? 0;
  }

  return {
    stores: calcs,
    totalShipping: Math.round(totalShipping * 100) / 100
  };
}
