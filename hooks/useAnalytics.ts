import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useAnalytics(storeId: string | undefined) {
  return useQuery({
    queryKey: ['seller-analytics', storeId],
    queryFn: async () => {
      if (!storeId) return null;

      // 1. Fetch completed and pending orders for this store
      const { data: rawOrders, error: ordersError } = await supabase
        .from('child_orders')
        .select('*, order_items(*)')
        .eq('store_id', storeId);

      if (ordersError) throw ordersError;
      const orders = rawOrders || [];

      // 2. Fetch products details (to check stock alerts)
      const { data: rawProducts, error: prodsError } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId);

      if (prodsError) throw prodsError;
      const products = rawProducts || [];

      // 3. Compile analytics metrics
      const successfulOrders = orders.filter((o) => o.status !== 'cancelled');
      const totalRevenue = successfulOrders.reduce((sum, o) => sum + Number(o.subtotal), 0);
      const ordersCount = orders.length;
      const lowStockAlerts = products.filter((p) => p.stock <= 3 && p.stock > 0).length;
      const outOfStock = products.filter((p) => p.stock === 0).length;

      // 4. Group earnings by date for the last 7 days (earnings history timeline)
      const earningsByDate: Record<string, number> = {};
      const orderCountByDate: Record<string, number> = {};

      // Initialize last 7 days with 0
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        earningsByDate[label] = 0;
        orderCountByDate[label] = 0;
      }

      successfulOrders.forEach((o) => {
        const dateLabel = new Date(o.created_at || '').toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
        if (earningsByDate[dateLabel] !== undefined) {
          earningsByDate[dateLabel] += Number(o.subtotal);
          orderCountByDate[dateLabel] += 1;
        }
      });

      const revenueTimeline = Object.entries(earningsByDate).map(([date, revenue]) => ({
        date,
        revenue,
        orders: orderCountByDate[date] || 0,
      }));

      // 5. Group products by sales (Top selling items)
      const topProducts = [...products]
        .sort((a, b) => (b.total_sold || 0) - (a.total_sold || 0))
        .slice(0, 5)
        .map((p) => ({
          name: p.name,
          sold: p.total_sold || 0,
          revenue: (p.total_sold || 0) * p.price,
        }));

      // 6. Group orders by status (for visual pie division)
      const statusCounts: Record<string, number> = {
        pending: 0,
        confirmed: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
      };

      orders.forEach((o) => {
        const s = o.status || 'pending';
        if (statusCounts[s] !== undefined) {
          statusCounts[s] += 1;
        }
      });

      const orderStatuses = Object.entries(statusCounts).map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count,
      }));

      return {
        totalRevenue,
        ordersCount,
        lowStockAlerts,
        outOfStock,
        revenueTimeline,
        topProducts,
        orderStatuses,
      };
    },
    enabled: !!storeId,
  });
}
