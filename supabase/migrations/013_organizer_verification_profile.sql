-- ========================================================
-- Migration 013: Organizer Verification Profile & Document Storage
-- ========================================================

-- 1. Create organizer_verifications table
CREATE TABLE IF NOT EXISTS public.organizer_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Personal Info
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  profile_picture TEXT,
  
  -- Organization Info
  organization_name TEXT NOT NULL,
  organization_type TEXT NOT NULL,
  designation TEXT NOT NULL,
  college TEXT NOT NULL,
  department TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'India',
  
  -- Experience
  years_experience TEXT NOT NULL,
  prev_events TEXT NOT NULL,
  approx_participants TEXT NOT NULL,
  categories_managed TEXT[] DEFAULT '{}'::text[],
  
  -- Document URLs
  govt_id_url TEXT NOT NULL,
  college_id_url TEXT NOT NULL,
  auth_letter_url TEXT,
  club_cert_url TEXT,
  supporting_doc_url TEXT,
  
  -- Verification State
  verification_status TEXT DEFAULT 'pending'
    CHECK (verification_status IN ('unsubmitted', 'pending', 'under_review', 'approved', 'rejected')),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id),
  rejection_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add verification_status column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unsubmitted'
    CHECK (verification_status IN ('unsubmitted', 'pending', 'under_review', 'approved', 'rejected'));

-- Update verification_status for existing approved organizers
UPDATE public.profiles
SET verification_status = 'approved'
WHERE role = 'organizer' AND (approval_status = 'approved' OR organizer_status = 'approved');

UPDATE public.profiles
SET verification_status = 'approved'
WHERE role IN ('student', 'volunteer', 'admin');

-- 3. Enable RLS on organizer_verifications
ALTER TABLE public.organizer_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their verification profile" ON public.organizer_verifications;
CREATE POLICY "Users can view their verification profile"
  ON public.organizer_verifications FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Organizers can insert their verification profile" ON public.organizer_verifications;
CREATE POLICY "Organizers can insert their verification profile"
  ON public.organizer_verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Organizers can update their verification profile" ON public.organizer_verifications;
CREATE POLICY "Organizers can update their verification profile"
  ON public.organizer_verifications FOR UPDATE
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 4. Create storage bucket for organizer verification documents if not existing
INSERT INTO storage.buckets (id, name, public)
VALUES ('organizer-documents', 'organizer-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for organizer-documents
DROP POLICY IF EXISTS "Allow authenticated uploads to organizer-documents" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to organizer-documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'organizer-documents' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow public read access to organizer-documents" ON storage.objects;
CREATE POLICY "Allow public read access to organizer-documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'organizer-documents');
