-- Migration 016: Add faculty_advisor_name column to public.profiles and public.organizer_verifications

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS faculty_advisor_name TEXT;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'organizer_verifications'
    ) THEN
        ALTER TABLE public.organizer_verifications
        ADD COLUMN IF NOT EXISTS faculty_advisor_name TEXT;
    END IF;
END $$;
