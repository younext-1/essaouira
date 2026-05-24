import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getProfileByClerkId } from '@/lib/db/users';
import { getStoreByOwner } from '@/lib/db/stores';
import { getStoreAnalytics } from '@/lib/analytics/compiler';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const analyticsQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid startDate format. Use YYYY-MM-DD').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid endDate format. Use YYYY-MM-DD').optional(),
});

/**
 * GET /api/v1/seller/analytics
 * يجلب بيانات التحليلات والأداء لمتجر الحرفي الحالي.
 */
export async function GET(request: Request) {
  try {
    // 1. التحقق من تسجيل الدخول
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json(
        { success: false, data: null, message: 'Unauthorized. Authentication required.' },
        { status: 401 }
      );
    }

    // 2. جلب ملف الحساب الشخصي
    const profile = await getProfileByClerkId(clerkId);
    if (!profile) {
      return NextResponse.json(
        { success: false, data: null, message: 'Authenticated user profile not found.' },
        { status: 404 }
      );
    }

    // 3. التحقق من الصلاحيات (حرفي أو مدير)
    const isAuthorized = profile.role === 'artisan' || profile.role === 'admin' || profile.role === 'moderator';
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, data: null, message: 'Access Denied: Artisan or Admin role required.' },
        { status: 403 }
      );
    }

    // 4. جلب المتجر الخاص بالبائع
    const store = await getStoreByOwner(profile.id);
    if (!store) {
      return NextResponse.json(
        { success: false, data: null, message: 'No registered store found for this artisan account.' },
        { status: 404 }
      );
    }

    // 5. تحليل واستخراج معايير البحث والتواريخ
    const { searchParams } = new URL(request.url);
    const rawStartDate = searchParams.get('startDate') || undefined;
    const rawEndDate = searchParams.get('endDate') || undefined;

    const validated = analyticsQuerySchema.safeParse({
      startDate: rawStartDate,
      endDate: rawEndDate,
    });

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: 'Validation failed.',
          errors: validated.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // تعيين تواريخ افتراضية (آخر 30 يوماً) في حال غيابها
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const formatOffsetDate = (d: Date) => d.toISOString().split('T')[0];

    const startDate = validated.data.startDate || formatOffsetDate(thirtyDaysAgo);
    const endDate = validated.data.endDate || formatOffsetDate(today);

    // 6. استدعاء المساعد لجلب بيانات التحليلات من قاعدة البيانات
    const supabase = await createClient();
    const result = await getStoreAnalytics(supabase, store.id, startDate, endDate);

    if (!result.success) {
      return NextResponse.json(
        { success: false, data: null, message: result.message || 'Failed to query store analytics.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Store performance analytics retrieved successfully.',
    });
  } catch (err: any) {
    console.error('🔴 GET /api/v1/seller/analytics error:', err);
    return NextResponse.json(
      { success: false, data: null, message: err.message || 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
