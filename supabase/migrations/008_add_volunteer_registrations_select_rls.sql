-- Migration 008: Add SELECT policy for approved volunteers on public.registrations
-- Allows approved volunteers to view registrations for events they are assigned to.

DROP POLICY IF EXISTS "Approved volunteers can view registrations for their events" ON public.registrations;

CREATE POLICY "Approved volunteers can view registrations for their events"
  ON public.registrations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.volunteers v
      WHERE v.event_id = public.registrations.event_id
        AND v.user_id = auth.uid()
        AND v.application_status = 'approved'
    )
  );
