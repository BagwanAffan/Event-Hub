-- Migration 010: Add SELECT policy for approved volunteers on public.attendance
-- Allows approved volunteers to view attendance records for events they are assigned to or scans they performed.

DROP POLICY IF EXISTS "Approved volunteers can view attendance for their events" ON public.attendance;

CREATE POLICY "Approved volunteers can view attendance for their events"
  ON public.attendance FOR SELECT
  TO authenticated
  USING (
    volunteer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.volunteers v
      WHERE v.event_id = public.attendance.event_id
        AND v.user_id = auth.uid()
        AND v.application_status = 'approved'
    )
  );
