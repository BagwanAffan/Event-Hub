-- ============================================
-- MIGRATION 017: Post-Event Feedback & Rating System
-- ============================================

-- Upgrade or create public.feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  registration_id UUID REFERENCES public.registrations(id) ON DELETE SET NULL,
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  organization_rating INTEGER CHECK (organization_rating IS NULL OR (organization_rating >= 1 AND organization_rating <= 5)),
  content_rating INTEGER CHECK (content_rating IS NULL OR (content_rating >= 1 AND content_rating <= 5)),
  venue_rating INTEGER CHECK (venue_rating IS NULL OR (venue_rating >= 1 AND venue_rating <= 5)),
  speaker_rating INTEGER CHECK (speaker_rating IS NULL OR (speaker_rating >= 1 AND speaker_rating <= 5)),
  recommendation TEXT CHECK (recommendation IS NULL OR recommendation IN ('yes', 'maybe', 'no')),
  comment TEXT CHECK (comment IS NULL OR char_length(comment) <= 300),
  anonymous BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT feedback_event_user_key UNIQUE (event_id, user_id)
);

-- Ensure all columns exist if table was previously partially defined
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS registration_id UUID REFERENCES public.registrations(id) ON DELETE SET NULL;
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS overall_rating INTEGER;
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS organization_rating INTEGER;
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS content_rating INTEGER;
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS venue_rating INTEGER;
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS speaker_rating INTEGER;
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS recommendation TEXT;
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS comment TEXT;
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS anonymous BOOLEAN DEFAULT false;
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_feedback_event_id ON public.feedback(event_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at DESC);

-- Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Drop prior simple policies if existing
DROP POLICY IF EXISTS "Users can view feedback for completed events" ON public.feedback;
DROP POLICY IF EXISTS "Users can submit feedback" ON public.feedback;
DROP POLICY IF EXISTS "Allow select for feedback" ON public.feedback;
DROP POLICY IF EXISTS "Allow insert for feedback" ON public.feedback;
DROP POLICY IF EXISTS "Allow update for feedback" ON public.feedback;
DROP POLICY IF EXISTS "Allow delete for feedback" ON public.feedback;

-- RLS Policies
-- SELECT: Everyone authenticated can view feedback
CREATE POLICY "Allow select for feedback"
  ON public.feedback FOR SELECT
  USING (true);

-- INSERT: Students can create feedback for themselves
CREATE POLICY "Allow insert for feedback"
  ON public.feedback FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can update their own feedback within 24 hours of creation
CREATE POLICY "Allow update for update"
  ON public.feedback FOR UPDATE
  USING (
    user_id = auth.uid() 
    AND created_at >= (NOW() - INTERVAL '24 hours')
  )
  WITH CHECK (
    user_id = auth.uid()
  );

-- DELETE: Only admins can delete feedback
CREATE POLICY "Allow delete for feedback"
  ON public.feedback FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
