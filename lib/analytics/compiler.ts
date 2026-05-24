import { SupabaseClient } from '@supabase/supabase-js';
import { RecordAnalyticsInput, StoreAnalyticsSummary, AdminLedgerSummary } from '@/types';

/**
 * تسجيل حدث تحليلي في السوق.
 * تم تصميم هذه الدالة لتكون مرنة وموثوقة للغاية، حيث تقوم بالتقاط كافة الأخطاء بصمت
 * لضمان عدم إعاقة عمليات الدفع أو التصفح الحيوية للمستخدمين بسبب فشل التتبع والتحليل.
 */
export async function recordAnalyticsEvent(
  supabase: SupabaseClient,
  input: RecordAnalyticsInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('marketplace_analytics_events')
      .insert({
        store_id: input.storeId || null,
        product_id: input.productId || null,
        visitor_id: input.visitorId || null,
        profile_id: input.profileId || null,
        event_type: input.eventType,
        metadata: input.metadata || {},
      });

    if (error) {
      console.error('Error logging analytics event:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Failed to log analytics event:', err);
    return { success: false, error: err?.message || 'Unknown error' };
  }
}

/**
 * جلب بيانات الأداء والتحليلات لمتجر معين خلال نطاق زمني محدد.
 */
export async function getStoreAnalytics(
  supabase: SupabaseClient,
  storeId: string,
  startDate: string,
  endDate: string
): Promise<{ success: boolean; data?: StoreAnalyticsSummary[]; message?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_store_analytics_summary', {
      p_store_id: storeId,
      p_start_date: startDate,
      p_end_date: endDate,
    });

    if (error) {
      console.error('Error calling get_store_analytics_summary:', error);
      return { success: false, message: error.message };
    }

    // تنسيق البيانات الواردة بدقة وضمان تحويل القيم إلى أرقام
    const formattedData: StoreAnalyticsSummary[] = (data || []).map((row: any) => ({
      date: row.date,
      views: Number(row.views || 0),
      orders: Number(row.orders || 0),
      revenue: Number(row.revenue || 0),
      cancellation_rate: Number(row.cancellation_rate || 0),
      conversion_rate: Number(row.conversion_rate || 0),
    }));

    return { success: true, data: formattedData };
  } catch (err: any) {
    console.error('Failed to query store analytics:', err);
    return { success: false, message: err?.message || 'Unknown error occurred' };
  }
}

/**
 * جلب السجل المالي العام للمنصة لمسؤولي النظام (Admins).
 */
export async function getAdminLedger(
  supabase: SupabaseClient,
  startDate: string,
  endDate: string
): Promise<{ success: boolean; data?: AdminLedgerSummary; message?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_admin_ledger_summary', {
      p_start_date: startDate,
      p_end_date: endDate,
    });

    if (error) {
      console.error('Error calling get_admin_ledger_summary:', error);
      return { success: false, message: error.message };
    }

    const row = data?.[0] || {};
    const formattedData: AdminLedgerSummary = {
      total_volume: Number(row.total_volume || 0),
      total_platform_fees: Number(row.total_platform_fees || 0),
      total_shipping_costs: Number(row.total_shipping_costs || 0),
      total_seller_earnings: Number(row.total_seller_earnings || 0),
      escrow_holding: Number(row.escrow_holding || 0),
      escrow_released: Number(row.escrow_released || 0),
      escrow_refunded: Number(row.escrow_refunded || 0),
      escrow_disputed: Number(row.escrow_disputed || 0),
    };

    return { success: true, data: formattedData };
  } catch (err: any) {
    console.error('Failed to query admin ledger:', err);
    return { success: false, message: err?.message || 'Unknown error occurred' };
  }
}
