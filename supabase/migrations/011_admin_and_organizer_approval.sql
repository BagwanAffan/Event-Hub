-- ============================================
-- Migration 011: Admin Module & Organizer Approval System
-- ============================================

-- 1. Update profiles table check constraint for role to include 'admin'
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('student', 'organizer', 'volunteer', 'admin'));

-- 2. Add organizer approval & organization fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS organizer_status TEXT DEFAULT 'pending'
    CHECK (organizer_status IN ('pending', 'under_review', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS club_name TEXT,
  ADD COLUMN IF NOT EXISTS position TEXT,
  ADD COLUMN IF NOT EXISTS organization_type TEXT;

-- Index for fast organizer screening queries
CREATE INDEX IF NOT EXISTS idx_profiles_organizer_status ON public.profiles(organizer_status);

-- 3. Safely update existing organizers to 'approved'
UPDATE public.profiles
SET organizer_status = 'approved'
WHERE role = 'organizer' AND (organizer_status IS NULL OR organizer_status = 'pending');

-- 4. Update trigger function for new user registration
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
    club_name,
    position,
    organization_type
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
    CASE WHEN user_role = 'organizer' THEN 'pending' ELSE NULL END,
    NEW.raw_user_meta_data->>'club_name',
    NEW.raw_user_meta_data->>'position',
    NEW.raw_user_meta_data->>'organization_type'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Seed Predefined Administrator Account in Supabase Auth & Profiles
DO $$
DECLARE
  admin_id UUID := 'a0000000-0000-0000-0000-000000000001'::UUID;
BEGIN
  -- Insert into auth.users if not already exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@eventhub.edu') THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role,
      created_at,
      updated_at
    ) VALUES (
      admin_id,
      '00000000-0000-0000-0000-000000000000'::UUID,
      'admin@eventhub.edu',
      crypt('AdminPass123!', gen_salt('bf')),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      '{"full_name": "System Administrator", "role": "admin"}'::jsonb,
      'authenticated',
      'authenticated',
      NOW(),
      NOW()
    );

    -- Insert profile
    INSERT INTO public.profiles (
      id,
      email,
      full_name,
      role,
      status,
      college
    ) VALUES (
      admin_id,
      'admin@eventhub.edu',
      'System Administrator',
      'admin',
      'active',
      'EventHub Administration'
    )
    ON CONFLICT (id) DO UPDATE SET
      role = 'admin',
      status = 'active';
  ELSE
    -- If profile exists, ensure role is admin
    UPDATE public.profiles
    SET role = 'admin', status = 'active'
    WHERE email = 'admin@eventhub.edu';
  END IF;
END $$;

-- 6. Add RLS Policies for Administrator Full Access
CREATE POLICY "Admins have full access to profiles"
  ON public.profiles FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins have full access to events"
  ON public.events FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins have full access to registrations"
  ON public.registrations FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins have full access to teams"
  ON public.teams FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins have full access to team_members"
  ON public.team_members FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins have full access to payments"
  ON public.payments FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins have full access to volunteers"
  ON public.volunteers FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins have full access to volunteer_tasks"
  ON public.volunteer_tasks FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins have full access to attendance"
  ON public.attendance FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins have full access to certificates"
  ON public.certificates FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins have full access to notifications"
  ON public.notifications FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins have full access to announcements"
  ON public.announcements FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins have full access to audit_logs"
  ON public.audit_logs FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
