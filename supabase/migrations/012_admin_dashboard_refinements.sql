-- ========================================================
-- Unified Migration 012: Safe Admin Role & Organizer Approval Setup
-- ========================================================

-- 1. Update role constraint on public.profiles to allow 'admin'
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('student', 'organizer', 'volunteer', 'admin'));

-- 2. Add all organizer status, approval, organizational, and control columns safely
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS organizer_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_docs TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS organization TEXT,
  ADD COLUMN IF NOT EXISTS club_name TEXT,
  ADD COLUMN IF NOT EXISTS designation TEXT,
  ADD COLUMN IF NOT EXISTS position TEXT,
  ADD COLUMN IF NOT EXISTS organization_type TEXT,
  ADD COLUMN IF NOT EXISTS experience TEXT,
  ADD COLUMN IF NOT EXISTS is_soft_deleted BOOLEAN DEFAULT FALSE;

-- 3. Add status check constraints
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_organizer_status_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_organizer_status_check
  CHECK (organizer_status IN ('pending', 'under_review', 'approved', 'rejected'));

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_approval_status_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_approval_status_check
  CHECK (approval_status IN ('pending', 'under_review', 'approved', 'rejected'));

-- 4. Safely set default approval status for existing accounts
UPDATE public.profiles
SET approval_status = COALESCE(organizer_status, 'approved')
WHERE role = 'organizer' AND (approval_status IS NULL OR approval_status = 'pending');

UPDATE public.profiles
SET approval_status = 'approved'
WHERE role IN ('student', 'volunteer', 'admin');

-- 5. Add event control columns
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS is_disabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_soft_deleted BOOLEAN DEFAULT FALSE;

-- 6. Add performance indexes
CREATE INDEX IF NOT EXISTS idx_profiles_approval_status ON public.profiles(approval_status);
CREATE INDEX IF NOT EXISTS idx_profiles_organizer_status ON public.profiles(organizer_status);
CREATE INDEX IF NOT EXISTS idx_profiles_is_soft_deleted ON public.profiles(is_soft_deleted);
CREATE INDEX IF NOT EXISTS idx_events_is_soft_deleted ON public.events(is_soft_deleted);

-- 7. Update handle_new_user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    college,
    department,
    year,
    phone,
    organizer_status,
    approval_status,
    organization,
    club_name,
    designation,
    position,
    organization_type,
    experience
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    user_role,
    COALESCE(NEW.raw_user_meta_data->>'college', 'Default College'),
    NEW.raw_user_meta_data->>'department',
    NEW.raw_user_meta_data->>'year',
    NEW.raw_user_meta_data->>'phone',
    CASE WHEN user_role = 'organizer' THEN 'pending' ELSE 'approved' END,
    CASE WHEN user_role = 'organizer' THEN 'pending' ELSE 'approved' END,
    COALESCE(NEW.raw_user_meta_data->>'organization', NEW.raw_user_meta_data->>'club_name'),
    NEW.raw_user_meta_data->>'club_name',
    COALESCE(NEW.raw_user_meta_data->>'designation', NEW.raw_user_meta_data->>'position'),
    NEW.raw_user_meta_data->>'position',
    NEW.raw_user_meta_data->>'organization_type',
    NEW.raw_user_meta_data->>'experience'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Seed Predefined Admin Account (admin@eventhub.edu)
DO $$
DECLARE
  admin_uid UUID;
BEGIN
  SELECT id INTO admin_uid FROM auth.users WHERE email = 'admin@eventhub.edu';

  IF admin_uid IS NULL THEN
    admin_uid := gen_random_uuid();
    
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) VALUES (
      admin_uid,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'admin@eventhub.edu',
      crypt('AdminPass123!', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"System Administrator","role":"admin"}',
      NOW(),
      NOW()
    );
  END IF;

  INSERT INTO public.profiles (
    id, email, full_name, role, college, department, status, organizer_status, approval_status, created_at, updated_at
  ) VALUES (
    admin_uid, 'admin@eventhub.edu', 'System Administrator', 'admin', 'Apex Institute', 'Administration', 'active', 'approved', 'approved', NOW(), NOW()
  ) ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    organizer_status = 'approved',
    approval_status = 'approved',
    status = 'active';
END $$;
