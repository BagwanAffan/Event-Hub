-- Migration 007: Explicit RLS Policies for volunteer_tasks Table
-- Authorizes access via volunteer_tasks.volunteer_id -> volunteers.id -> volunteers.user_id = auth.uid()

DROP POLICY IF EXISTS "Volunteers can view their assigned tasks" ON public.volunteer_tasks;
DROP POLICY IF EXISTS "Volunteers can update their task status" ON public.volunteer_tasks;
DROP POLICY IF EXISTS "Organizers can manage tasks for their events" ON public.volunteer_tasks;

-- 1. Volunteers SELECT policy: link volunteer_tasks.volunteer_id to volunteers.id, then match volunteers.user_id to auth.uid()
CREATE POLICY "Volunteers can view their assigned tasks"
  ON public.volunteer_tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.volunteers v
      WHERE v.id = public.volunteer_tasks.volunteer_id
        AND v.user_id = auth.uid()
        AND v.application_status = 'approved'
    )
  );

-- 2. Volunteers UPDATE policy: update task status for tasks assigned to their volunteer record
CREATE POLICY "Volunteers can update their task status"
  ON public.volunteer_tasks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.volunteers v
      WHERE v.id = public.volunteer_tasks.volunteer_id
        AND v.user_id = auth.uid()
        AND v.application_status = 'approved'
    )
  );

-- 3. Organizers ALL policy: manage tasks for events created by auth.uid()
CREATE POLICY "Organizers can manage tasks for their events"
  ON public.volunteer_tasks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = public.volunteer_tasks.event_id
        AND e.created_by = auth.uid()
    )
  );
