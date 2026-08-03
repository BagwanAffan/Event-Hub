-- Migration 009: Redesign Volunteer Task Workflow to Organizer Verification

-- 1. Add workflow & attendance columns to volunteer_tasks
ALTER TABLE public.volunteer_tasks
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE NULL,
  ADD COLUMN IF NOT EXISTS attendance_status TEXT DEFAULT 'pending' CHECK (attendance_status IN ('pending', 'present', 'absent')),
  ADD COLUMN IF NOT EXISTS attendance_marked_at TIMESTAMP WITH TIME ZONE NULL;

-- 2. Migrate existing task status values
UPDATE public.volunteer_tasks
SET status = 'assigned'
WHERE status IN ('pending', 'in_progress');

UPDATE public.volunteer_tasks
SET status = 'accepted', accepted_at = COALESCE(accepted_at, updated_at, NOW())
WHERE status = 'completed';

-- 3. Update status CHECK constraint
ALTER TABLE public.volunteer_tasks
  DROP CONSTRAINT IF EXISTS volunteer_tasks_status_check;

ALTER TABLE public.volunteer_tasks
  ADD CONSTRAINT volunteer_tasks_status_check
  CHECK (status IN ('assigned', 'accepted', 'pending', 'completed', 'cancelled'));
