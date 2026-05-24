-- =========================================================
-- Migration 019: Complete Notification System
-- =========================================================

BEGIN;

-- 1. CREATE NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'order_placed',
    'order_confirmed',
    'order_shipped',
    'order_delivered',
    'order_cancelled',
    'escrow_released',
    'payout_requested',
    'payout_processed',
    'payout_rejected',
    'refund_requested',
    'refund_approved',
    'refund_rejected',
    'new_message',
    'review_received',
    'system_alert'
  )),
  title VARCHAR(255) NOT NULL CHECK (char_length(trim(title)) > 0),
  body TEXT NOT NULL CHECK (char_length(trim(body)) > 0),
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. DEFINE HIGH-PERFORMANCE INDEXES
-- Index to fetch user notifications sorted by date
CREATE INDEX IF NOT EXISTS idx_notifications_profile_created 
  ON public.notifications(profile_id, created_at DESC);

-- Index for fast counting and querying of unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_unread_lookup 
  ON public.notifications(profile_id, is_read) 
  WHERE (is_read = FALSE);

-- 3. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ── NOTIFICATIONS RLS POLICIES ──

-- Select: A user can only view their own notifications
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
CREATE POLICY "notifications_select" ON public.notifications
  FOR SELECT USING (
    profile_id IN (
      SELECT id FROM public.profiles 
      WHERE clerk_id = public.get_clerk_id()
    )
  );

-- Update: A user can only update their own notifications (e.g. to mark as read)
DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
CREATE POLICY "notifications_update" ON public.notifications
  FOR UPDATE USING (
    profile_id IN (
      SELECT id FROM public.profiles 
      WHERE clerk_id = public.get_clerk_id()
    )
  );

-- Note: No INSERT policy is provided. Notifications are created securely via backend API calls
-- using the Supabase Admin Client to prevent spamming and client-side manipulation of system alerts.

COMMIT;
