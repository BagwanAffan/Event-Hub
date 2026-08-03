-- Migration 006: Fix Volunteers Table application_status CHECK Constraint
-- Updates volunteers_application_status_check constraint to include 'not_present'

ALTER TABLE public.volunteers
DROP CONSTRAINT IF EXISTS volunteers_application_status_check;

ALTER TABLE public.volunteers
ADD CONSTRAINT volunteers_application_status_check
CHECK (application_status IN ('pending', 'approved', 'rejected', 'not_present'));
