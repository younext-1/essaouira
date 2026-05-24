-- =========================================================
-- Migration 011: Complete User Management System
-- =========================================================

-- 1. ADAPT PROFILES TABLE FOR MULTI-ROLE & CLERK Webhooks
-- Drop old referencing constraint to auth.users since Clerk is the authentication system
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Ensure profiles primary key is simple UUID and all necessary fields exist
ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email VARCHAR UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone VARCHAR;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name VARCHAR;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url VARCHAR;

-- Drop the old role check constraint if it exists
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add the new 4-role check constraint (tourist, artisan, moderator, admin)
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('tourist', 'artisan', 'moderator', 'admin'));

-- Ensure standard columns exist with defaults
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'tourist';
ALTER TABLE public.profiles ALTER COLUMN is_artisan SET DEFAULT false;
ALTER TABLE public.profiles ALTER COLUMN verified SET DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. CREATE PROFILE VERIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.profile_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  document_type VARCHAR NOT NULL,
  document_url VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CREATE AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action VARCHAR NOT NULL,
  target_type VARCHAR NOT NULL,
  target_id VARCHAR NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address VARCHAR,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CREATE DATABASE INDEXES FOR OPTIMAL QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_verifications_profile_id ON public.profile_verifications(profile_id);
CREATE INDEX IF NOT EXISTS idx_verifications_status ON public.profile_verifications(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- 5. CONFIGURE SECURE ROW-LEVEL SECURITY (RLS)
ALTER TABLE public.profile_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ── PROFILE VERIFICATIONS RLS POLICIES ──
DROP POLICY IF EXISTS "verifications_owner_read" ON public.profile_verifications;
CREATE POLICY "verifications_owner_read" ON public.profile_verifications
  FOR SELECT USING (
    profile_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id())
  );

DROP POLICY IF EXISTS "verifications_owner_insert" ON public.profile_verifications;
CREATE POLICY "verifications_owner_insert" ON public.profile_verifications
  FOR INSERT WITH CHECK (
    profile_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id())
  );

DROP POLICY IF EXISTS "verifications_admin_moderator_all" ON public.profile_verifications;
CREATE POLICY "verifications_admin_moderator_all" ON public.profile_verifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE clerk_id = public.get_clerk_id() AND role IN ('admin', 'moderator')
    )
  );

-- ── AUDIT LOGS RLS POLICIES ──
DROP POLICY IF EXISTS "audit_logs_admin_all" ON public.audit_logs;
CREATE POLICY "audit_logs_admin_all" ON public.audit_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE clerk_id = public.get_clerk_id() AND role = 'admin'
    )
  );

-- 6. AUDIT TRIGGER WORKFLOWS
-- Log sensitive profile changes (role modifications, verification state)
CREATE OR REPLACE FUNCTION public.log_sensitive_profile_actions()
RETURNS TRIGGER AS $$
DECLARE
  v_actor_id UUID;
BEGIN
  -- Attempt to lookup active profile ID based on Clerk UID claim
  SELECT id INTO v_actor_id FROM public.profiles WHERE clerk_id = public.get_clerk_id();

  -- Log Role Update
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, metadata)
    VALUES (
      v_actor_id,
      'UPDATE_ROLE',
      'profile',
      NEW.id::TEXT,
      jsonb_build_object('old_role', OLD.role, 'new_role', NEW.role)
    );
  END IF;

  -- Log Verification Flag Escalation
  IF OLD.verified IS DISTINCT FROM NEW.verified THEN
    INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, metadata)
    VALUES (
      v_actor_id,
      'UPDATE_VERIFIED',
      'profile',
      NEW.id::TEXT,
      jsonb_build_object('old_verified', OLD.verified, 'new_verified', NEW.verified)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_log_sensitive_profile_actions ON public.profiles;
CREATE TRIGGER trg_log_sensitive_profile_actions
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_profile_actions();

-- Log administrative verification reviews
CREATE OR REPLACE FUNCTION public.log_verification_actions()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, metadata)
    VALUES (
      NEW.reviewed_by,
      'REVIEW_VERIFICATION',
      'profile_verification',
      NEW.id::TEXT,
      jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status, 'notes', NEW.notes)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_log_verification_actions ON public.profile_verifications;
CREATE TRIGGER trg_log_verification_actions
  AFTER UPDATE ON public.profile_verifications
  FOR EACH ROW EXECUTE FUNCTION public.log_verification_actions();
