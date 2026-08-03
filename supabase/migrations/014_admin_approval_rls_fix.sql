-- ========================================================
-- Migration 014: Admin Approval & RLS Coercion Fix
-- ========================================================

-- 1. Create SECURITY DEFINER function to safely check if current auth.uid() is Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. Grant Admin UPDATE RLS policy on public.profiles
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Admins can select all profiles" ON public.profiles;
CREATE POLICY "Admins can select all profiles"
  ON public.profiles FOR SELECT
  USING (true);

-- 3. Grant Admin UPDATE RLS policy on public.organizer_verifications
DROP POLICY IF EXISTS "Admins can update all verifications" ON public.organizer_verifications;
CREATE POLICY "Admins can update all verifications"
  ON public.organizer_verifications FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admins can select all verifications" ON public.organizer_verifications;
CREATE POLICY "Admins can select all verifications"
  ON public.organizer_verifications FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

-- 4. Grant notification INSERT RLS policy for system notifications
DROP POLICY IF EXISTS "Allow notification creation" ON public.notifications;
CREATE POLICY "Allow notification creation"
  ON public.notifications FOR INSERT
  WITH CHECK (true);
