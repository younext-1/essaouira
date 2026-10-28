import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('id');

    if (!orderId) {
      return NextResponse.json({ error: 'Missing order id' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: order, error } = await supabase
      .from('child_orders')
      .select(`
        *,
        stores (name, phone, logo_url, whatsapp),
        order_items (*)
      `)
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const store = order.stores || {};
    const items = order.order_items || [];
    const dateStr = new Date(order.created_at).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>وصل التسليم - ${orderId.substring(0, 8)}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; padding: 30px; background: #fff; color: #111; }
    .ticket { max-width: 700px; margin: 0 auto; border: 2px solid #111; padding: 25px; border-radius: 12px; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #eee; padding-bottom: 15px; }
    .logo { font-size: 22px; font-weight: bold; }
    .badge { background: #111; color: #fff; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: bold; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
    .box { background: #f9f9f9; padding: 15px; border-radius: 8px; font-size: 13px; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: right; }
    th { background: #f4f4f4; }
    .footer { margin-top: 30px; display: flex; justify-content: space-between; font-size: 12px; color: #555; }
    .signature { border: 1px dashed #aaa; padding: 20px; border-radius: 8px; text-align: center; margin-top: 15px; }
    @media print { body { padding: 0; } .ticket { border: none; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="no-print" style="max-width: 700px; margin: 0 auto 15px; text-align: left;">
    <button onclick="window.print()" style="background: #10b981; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer;">🖨️ طباعة وصل التسليم (Print BL)</button>
  </div>
  <div class="ticket">
    <div class="header">
      <div class="logo">📦 ${store.name || 'المتجر الإلكتروني'}</div>
      <div class="badge">وصل تسليم - BON DE LIVRAISON</div>
    </div>

    <div class="grid">
      <div class="box">
        <strong>📋 تفاصيل الطلبية:</strong><br/>
        رقم الطلب: #${order.id.substring(0, 8)}<br/>
        التاريخ: ${dateStr}<br/>
        طريقة الدفع: <strong>الدفع عند الاستلام (COD)</strong>
      </div>
      <div class="box">
        <strong>👤 معطيات الشحن والتوصيل:</strong><br/>
        ${order.seller_notes || 'معلومات الشحن مسجلة مع الطلب'}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>المنتج</th>
          <th>الكمية</th>
          <th>السعر الفردي</th>
          <th>المجموع</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((it: any) => `
          <tr>
            <td>${it.product_snapshot?.name || 'منتج'}</td>
            <td>${it.quantity}</td>
            <td>${it.unit_price} MAD</td>
            <td>${it.total_price} MAD</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div style="text-align: left; font-size: 18px; font-weight: bold; margin-top: 10px;">
      المبلغ الإجمالي الواجب تحصيله: <span style="color: #059669;">${order.subtotal} MAD</span>
    </div>

    <div class="footer">
      <div>هاتف المتجر: ${store.phone || store.whatsapp || '-'}</div>
      <div>شكراً لثقتكم بنا! ✨</div>
    </div>

    <div class="signature">
      توقيع وخاتم شركة التوصيل / توقيع المستلم
    </div>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
