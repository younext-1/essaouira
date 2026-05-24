import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getProfileByClerkId } from '@/lib/db/users';
import { getAdminLedger } from '@/lib/analytics/compiler';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const ledgerQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid startDate format. Use YYYY-MM-DD').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid endDate format. Use YYYY-MM-DD').optional(),
});

/**
 * GET /api/v1/admin/ledger
 * يجلب دفتر القيود والعمولات المالية المحتجزة والمفرج عنها لكامل المنصة (خاص بالمدراء).
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

    // 2. جلب حساب المستخدم الشخصي
    const profile = await getProfileByClerkId(clerkId);
    if (!profile) {
      return NextResponse.json(
        { success: false, data: null, message: 'Authenticated user profile not found.' },
        { status: 404 }
      );
    }

    // 3. التحقق الصارم من دور المدير (Admin)
    if (profile.role !== 'admin') {
      return NextResponse.json(
        { success: false, data: null, message: 'Access Denied: Administrative privileges required.' },
        { status: 403 }
      );
    }

    // 4. استخراج معايير البحث والتواريخ
    const { searchParams } = new URL(request.url);
    const rawStartDate = searchParams.get('startDate') || undefined;
    const rawEndDate = searchParams.get('endDate') || undefined;

    const validated = ledgerQuerySchema.safeParse({
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

    // تحديد النطاق الزمني الافتراضي لآخر 30 يوماً
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const formatOffsetDate = (d: Date) => d.toISOString().split('T')[0];

    const startDate = validated.data.startDate || formatOffsetDate(thirtyDaysAgo);
    const endDate = validated.data.endDate || formatOffsetDate(today);

    // 5. استدعاء المساعد لقراءة قيود الدفتر العام والضمان
    const supabase = await createClient();
    const result = await getAdminLedger(supabase, startDate, endDate);

    if (!result.success) {
      return NextResponse.json(
        { success: false, data: null, message: result.message || 'Failed to query admin ledger summary.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Platform financial ledger summary retrieved successfully.',
    });
  } catch (err: any) {
    console.error('🔴 GET /api/v1/admin/ledger error:', err);
    return NextResponse.json(
      { success: false, data: null, message: err.message || 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
