-- Migration 005: Fix Notifications RLS & Add 'not_present' Volunteer Status

-- 1. Update application_status constraint on public.volunteers to include 'not_present'
ALTER TABLE public.volunteers
DROP CONSTRAINT IF EXISTS volunteers_application_status_check;

ALTER TABLE public.volunteers
ADD CONSTRAINT volunteers_application_status_check
CHECK (application_status IN ('pending', 'approved', 'rejected', 'not_present'));

-- 2. Clean up any overly permissive notifications insert policies
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;

-- 3. Strict RLS on notifications: Users can view, update, and delete only their own notifications.
-- Direct client-side INSERT is restricted to prevent unauthorized cross-user notification spam.
-- In-app notification creation from business actions (e.g. volunteer approvals) is securely handled via server-side API route.
CREATE POLICY "Users can insert own notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
