-- Migration 015: Add Check-Out support to public.attendance
-- Extends attendance records for complete Check-In -> Check-Out workflow

ALTER TABLE public.attendance
  ADD COLUMN IF NOT EXISTS check_out_time TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS checked_in_by UUID REFERENCES public.profiles(id) NULL,
  ADD COLUMN IF NOT EXISTS checked_out_by UUID REFERENCES public.profiles(id) NULL;

-- Populate checked_in_by for existing rows from volunteer_id if null
UPDATE public.attendance
SET checked_in_by = volunteer_id
WHERE checked_in_by IS NULL AND volunteer_id IS NOT NULL;

-- Update constraint for attendance_status to include pending_checkout and present
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_attendance_status_check;

ALTER TABLE public.attendance ADD CONSTRAINT attendance_attendance_status_check 
  CHECK (attendance_status IN ('pending_checkout', 'present', 'checked_in', 'absent', 'late'));

-- Add UPDATE policy on public.attendance so approved volunteers and organizers can record check-out
DROP POLICY IF EXISTS "Approved volunteers and organizers can update attendance" ON public.attendance;

CREATE POLICY "Approved volunteers and organizers can update attendance"
  ON public.attendance FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.volunteers v
      WHERE v.user_id = auth.uid()
        AND v.event_id = public.attendance.event_id
        AND v.application_status = 'approved'
    )
    OR EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = public.attendance.event_id
        AND e.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.volunteers v
      WHERE v.user_id = auth.uid()
        AND v.event_id = public.attendance.event_id
        AND v.application_status = 'approved'
    )
    OR EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = public.attendance.event_id
        AND e.created_by = auth.uid()
    )
  );
