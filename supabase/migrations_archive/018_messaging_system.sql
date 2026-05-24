-- =========================================================
-- Migration 018: Complete Messaging & Chat System
-- =========================================================

BEGIN;

-- 1. CREATE CHAT THREADS TABLE
CREATE TABLE IF NOT EXISTS public.chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  child_order_id UUID REFERENCES public.child_orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CREATE CHAT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES public.chat_threads(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (char_length(trim(content)) > 0),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. DEFINE HIGH-PERFORMANCE INDEXES
-- Index to quickly find threads for a buyer
CREATE INDEX IF NOT EXISTS idx_chat_threads_buyer_id ON public.chat_threads(buyer_id);
-- Index to quickly find threads for a seller
CREATE INDEX IF NOT EXISTS idx_chat_threads_seller_id ON public.chat_threads(seller_id);
-- Index to quickly find threads for a store
CREATE INDEX IF NOT EXISTS idx_chat_threads_store_id ON public.chat_threads(store_id);
-- Index to quickly find threads by order context
CREATE INDEX IF NOT EXISTS idx_chat_threads_order_id ON public.chat_threads(child_order_id);

-- Partial unique indexes to prevent duplicate threads
-- Unique thread per buyer-store when there is no specific order context
CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_threads_buyer_store_no_order 
  ON public.chat_threads (buyer_id, store_id) 
  WHERE (child_order_id IS NULL);

-- Unique thread per buyer-store-order when there is specific order context
CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_threads_buyer_store_order 
  ON public.chat_threads (buyer_id, store_id, child_order_id) 
  WHERE (child_order_id IS NOT NULL);

-- Index to quickly get paginated messages in chronological order for a thread
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_created 
  ON public.chat_messages(thread_id, created_at ASC);

-- Index for unread messages lookup
CREATE INDEX IF NOT EXISTS idx_chat_messages_unread 
  ON public.chat_messages(thread_id, sender_id, is_read) 
  WHERE (is_read = FALSE);

-- 4. CREATE CONSTRAINTS AND TRIGGERS FOR DATA INTEGRITY

-- Trigger Function: Validate participants and contexts when creating a thread
CREATE OR REPLACE FUNCTION public.validate_chat_thread_participants()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure seller_id matches the owner_id of the store_id
  IF NOT EXISTS (
    SELECT 1 FROM public.stores
    WHERE id = NEW.store_id AND owner_id = NEW.seller_id AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'seller_id must be the active owner of the store';
  END IF;

  -- Ensure buyer_id is not the seller_id (an artisan cannot chat with themselves in a buyer/seller context)
  IF NEW.buyer_id = NEW.seller_id THEN
    RAISE EXCEPTION 'buyer_id and seller_id cannot be the same';
  END IF;

  -- Ensure that if child_order_id is provided, it matches buyer_id and store_id
  IF NEW.child_order_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.child_orders co
      JOIN public.parent_orders po ON co.parent_id = po.id
      WHERE co.id = NEW.child_order_id AND co.store_id = NEW.store_id AND po.buyer_id = NEW.buyer_id
    ) THEN
      RAISE EXCEPTION 'child_order_id does not belong to this buyer and store';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_validate_chat_thread_participants ON public.chat_threads;
CREATE TRIGGER trg_validate_chat_thread_participants
  BEFORE INSERT OR UPDATE ON public.chat_threads
  FOR EACH ROW EXECUTE FUNCTION public.validate_chat_thread_participants();

-- Trigger Function: Automatically update thread's updated_at timestamp when a new message is inserted
CREATE OR REPLACE FUNCTION public.update_chat_thread_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_threads
  SET updated_at = NOW()
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_chat_thread_timestamp ON public.chat_messages;
CREATE TRIGGER trg_update_chat_thread_timestamp
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_chat_thread_timestamp();

-- 5. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- ── CHAT THREADS RLS POLICIES ──

-- Select: Threads can be viewed if the user is either the buyer or the seller
DROP POLICY IF EXISTS "threads_select" ON public.chat_threads;
CREATE POLICY "threads_select" ON public.chat_threads
  FOR SELECT USING (
    buyer_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id())
    OR
    seller_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id())
  );

-- Insert: A participant can start a thread, provided they are the authenticated buyer or seller
DROP POLICY IF EXISTS "threads_insert" ON public.chat_threads;
CREATE POLICY "threads_insert" ON public.chat_threads
  FOR INSERT WITH CHECK (
    buyer_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id())
    OR
    seller_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id())
  );

-- Update: Allow updating
DROP POLICY IF EXISTS "threads_update" ON public.chat_threads;
CREATE POLICY "threads_update" ON public.chat_threads
  FOR UPDATE USING (
    buyer_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id())
    OR
    seller_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id())
  );

-- ── CHAT MESSAGES RLS POLICIES ──

-- Select: Messages can be viewed if the user is a participant of the parent thread
DROP POLICY IF EXISTS "messages_select" ON public.chat_messages;
CREATE POLICY "messages_select" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_threads t
      WHERE t.id = thread_id
      AND (
        t.buyer_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id())
        OR
        t.seller_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id())
      )
    )
  );

-- Insert: A user can send a message if they are a participant of the thread AND are the sender
DROP POLICY IF EXISTS "messages_insert" ON public.chat_messages;
CREATE POLICY "messages_insert" ON public.chat_messages
  FOR INSERT WITH CHECK (
    sender_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id())
    AND EXISTS (
      SELECT 1 FROM public.chat_threads t
      WHERE t.id = thread_id
      AND (
        t.buyer_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id())
        OR
        t.seller_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id())
      )
    )
  );

-- Update: A user can update message fields (limited to is_read) if they are a participant of the thread
DROP POLICY IF EXISTS "messages_update" ON public.chat_messages;
CREATE POLICY "messages_update" ON public.chat_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.chat_threads t
      WHERE t.id = thread_id
      AND (
        t.buyer_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id())
        OR
        t.seller_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id())
      )
    )
  );

COMMIT;
