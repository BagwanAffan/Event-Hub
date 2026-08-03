-- Migration 004: Volunteer Configuration Fields for Events
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS need_volunteers BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS volunteers_needed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS volunteer_roles TEXT[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS reporting_location TEXT,
ADD COLUMN IF NOT EXISTS reporting_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS shift_start_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS shift_end_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS volunteer_instructions TEXT;

-- Create index for filtering volunteer opportunities
CREATE INDEX IF NOT EXISTS idx_events_need_volunteers ON public.events (need_volunteers, status);
