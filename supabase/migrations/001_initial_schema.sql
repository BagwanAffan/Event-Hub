-- ============================================
-- EventHub Database Schema
-- Complete PostgreSQL schema for Supabase
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TABLE 1: profiles
-- Stores user information, linked to auth.users
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  profile_picture TEXT,
  role TEXT NOT NULL CHECK (role IN ('student', 'organizer', 'volunteer')),
  college TEXT DEFAULT 'Default College',
  department TEXT,
  year TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_status ON public.profiles(status);

-- ============================================
-- TABLE 2: events
-- Stores event details
-- ============================================
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  short_description TEXT,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  event_type TEXT DEFAULT 'offline' CHECK (event_type IN ('online', 'offline', 'hybrid')),
  venue TEXT,
  building TEXT,
  room TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  registration_deadline TIMESTAMPTZ,
  registration_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  registration_mode TEXT NOT NULL DEFAULT 'individual' CHECK (registration_mode IN ('individual', 'team', 'both')),
  max_participants INTEGER DEFAULT 100,
  max_teams INTEGER,
  max_team_size INTEGER DEFAULT 4,
  poster_url TEXT,
  banner_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'published', 'registration_open', 'registration_closed',
    'upcoming', 'ongoing', 'completed', 'cancelled', 'archived'
  )),
  payment_instructions TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  tags TEXT[],
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_created_by ON public.events(created_by);
CREATE INDEX idx_events_start_date ON public.events(start_date);
CREATE INDEX idx_events_registration_deadline ON public.events(registration_deadline);
CREATE INDEX idx_events_category ON public.events(category);

-- ============================================
-- TABLE 3: registrations
-- Stores every event registration
-- ============================================
CREATE TABLE public.registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  team_id UUID,
  registration_type TEXT NOT NULL DEFAULT 'individual' CHECK (registration_type IN ('individual', 'team')),
  status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (status IN (
    'pending_payment', 'payment_under_review', 'approved', 'rejected', 'cancelled', 'completed'
  )),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN (
    'not_required', 'pending', 'under_review', 'approved', 'rejected'
  )),
  qr_generated BOOLEAN NOT NULL DEFAULT FALSE,
  qr_token TEXT,
  phone TEXT,
  department TEXT,
  year TEXT,
  prn TEXT,
  special_requirements TEXT,
  emergency_contact TEXT,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX idx_registrations_event_id ON public.registrations(event_id);
CREATE INDEX idx_registrations_user_id ON public.registrations(user_id);
CREATE INDEX idx_registrations_team_id ON public.registrations(team_id);
CREATE INDEX idx_registrations_status ON public.registrations(status);
CREATE INDEX idx_registrations_payment_status ON public.registrations(payment_status);

-- ============================================
-- TABLE 4: teams
-- Stores team information
-- ============================================
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  leader_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  status TEXT NOT NULL DEFAULT 'forming' CHECK (status IN ('forming', 'submitted', 'approved', 'rejected', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_teams_event_id ON public.teams(event_id);
CREATE INDEX idx_teams_leader_id ON public.teams(leader_id);
CREATE INDEX idx_teams_invite_code ON public.teams(invite_code);

-- Add foreign key from registrations to teams
ALTER TABLE public.registrations
  ADD CONSTRAINT fk_registrations_team
  FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;

-- ============================================
-- TABLE 5: team_members
-- Stores team membership
-- ============================================
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'accepted', 'rejected', 'removed')),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

CREATE INDEX idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);

-- ============================================
-- TABLE 6: payments
-- Stores payment submissions
-- ============================================
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  payment_method TEXT CHECK (payment_method IN ('upi', 'bank_transfer', 'cash', 'other')),
  transaction_reference TEXT,
  screenshot_url TEXT,
  remarks TEXT,
  organizer_remarks TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_registration_id ON public.payments(registration_id);
CREATE INDEX idx_payments_event_id ON public.payments(event_id);
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_status ON public.payments(status);

-- ============================================
-- TABLE 7: volunteers
-- Stores volunteer applications
-- ============================================
CREATE TABLE public.volunteers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  application_status TEXT NOT NULL DEFAULT 'pending' CHECK (application_status IN ('pending', 'approved', 'rejected')),
  skills TEXT,
  notes TEXT,
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX idx_volunteers_event_id ON public.volunteers(event_id);
CREATE INDEX idx_volunteers_user_id ON public.volunteers(user_id);
CREATE INDEX idx_volunteers_application_status ON public.volunteers(application_status);

-- ============================================
-- TABLE 8: volunteer_tasks
-- Stores task assignments
-- ============================================
CREATE TABLE public.volunteer_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  volunteer_id UUID NOT NULL REFERENCES public.volunteers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
  checklist JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_volunteer_tasks_event_id ON public.volunteer_tasks(event_id);
CREATE INDEX idx_volunteer_tasks_volunteer_id ON public.volunteer_tasks(volunteer_id);
CREATE INDEX idx_volunteer_tasks_status ON public.volunteer_tasks(status);

-- ============================================
-- TABLE 9: attendance
-- Stores QR attendance records
-- ============================================
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  volunteer_id UUID REFERENCES public.profiles(id),
  check_in_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  attendance_status TEXT NOT NULL DEFAULT 'checked_in' CHECK (attendance_status IN ('checked_in', 'absent', 'late')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX idx_attendance_event_id ON public.attendance(event_id);
CREATE INDEX idx_attendance_registration_id ON public.attendance(registration_id);
CREATE INDEX idx_attendance_user_id ON public.attendance(user_id);

-- ============================================
-- TABLE 10: certificates
-- Stores generated certificates
-- ============================================
CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  registration_id UUID REFERENCES public.registrations(id) ON DELETE SET NULL,
  certificate_type TEXT NOT NULL CHECK (certificate_type IN ('participation', 'winner', 'runner_up', 'volunteer')),
  verification_id TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(8), 'hex'),
  certificate_url TEXT,
  generated_by UUID REFERENCES public.profiles(id),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_certificates_event_id ON public.certificates(event_id);
CREATE INDEX idx_certificates_user_id ON public.certificates(user_id);
CREATE INDEX idx_certificates_verification_id ON public.certificates(verification_id);
CREATE INDEX idx_certificates_registration_id ON public.certificates(registration_id);

-- ============================================
-- TABLE 11: notifications
-- Stores in-app notifications
-- ============================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('success', 'warning', 'error', 'info', 'announcement')),
  read BOOLEAN NOT NULL DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- ============================================
-- TABLE 12: announcements
-- Stores event announcements
-- ============================================
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  audience TEXT NOT NULL DEFAULT 'all' CHECK (audience IN ('all', 'participants', 'volunteers')),
  pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_announcements_event_id ON public.announcements(event_id);

-- ============================================
-- TABLE 13: event_faqs
-- Stores event FAQs
-- ============================================
CREATE TABLE public.event_faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_event_faqs_event_id ON public.event_faqs(event_id);

-- ============================================
-- TABLE 14: event_gallery
-- Stores event images
-- ============================================
CREATE TABLE public.event_gallery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_event_gallery_event_id ON public.event_gallery(event_id);

-- ============================================
-- TABLE 15: feedback
-- Stores event feedback
-- ============================================
CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX idx_feedback_event_id ON public.feedback(event_id);
CREATE INDEX idx_feedback_user_id ON public.feedback(user_id);

-- ============================================
-- TABLE 16: audit_logs
-- Stores activity history
-- ============================================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity);
CREATE INDEX idx_audit_logs_entity_id ON public.audit_logs(entity_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ============================================
-- TABLE 17: ai_history
-- Stores AI generations
-- ============================================
CREATE TABLE public.ai_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_history_user_id ON public.ai_history(user_id);
CREATE INDEX idx_ai_history_feature ON public.ai_history(feature);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_events BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_registrations BEFORE UPDATE ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_teams BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_team_members BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_payments BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_volunteers BEFORE UPDATE ON public.volunteers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_volunteer_tasks BEFORE UPDATE ON public.volunteer_tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_attendance BEFORE UPDATE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-create notification function
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info',
  p_action_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, action_url)
  VALUES (p_user_id, p_title, p_message, p_type, p_action_url)
  RETURNING id INTO notification_id;
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generate QR token
CREATE OR REPLACE FUNCTION public.generate_qr_token(
  p_registration_id UUID,
  p_event_id UUID,
  p_user_id UUID
)
RETURNS TEXT AS $$
DECLARE
  token TEXT;
BEGIN
  token := encode(
    digest(
      p_registration_id::text || p_event_id::text || p_user_id::text || NOW()::text,
      'sha256'
    ),
    'hex'
  );
  UPDATE public.registrations
  SET qr_token = token, qr_generated = TRUE, updated_at = NOW()
  WHERE id = p_registration_id;
  RETURN token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-generate QR on payment approval
CREATE OR REPLACE FUNCTION public.handle_payment_approved()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Update registration status
    UPDATE public.registrations
    SET status = 'approved',
        payment_status = 'approved',
        approved_at = NOW(),
        approved_by = NEW.verified_by
    WHERE id = NEW.registration_id;
    
    -- Generate QR token
    PERFORM public.generate_qr_token(NEW.registration_id, NEW.event_id, NEW.user_id);
    
    -- Create notification for student
    PERFORM public.create_notification(
      NEW.user_id,
      'Payment Approved',
      'Your payment for the event has been approved. Your QR pass is now available.',
      'success',
      '/student/registrations/' || NEW.registration_id::text
    );
  END IF;
  
  IF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
    -- Update registration
    UPDATE public.registrations
    SET payment_status = 'rejected'
    WHERE id = NEW.registration_id;
    
    -- Notify student
    PERFORM public.create_notification(
      NEW.user_id,
      'Payment Rejected',
      COALESCE('Your payment was rejected. Reason: ' || NEW.organizer_remarks, 'Your payment was rejected. Please contact the organizer.'),
      'error',
      '/student/registrations/' || NEW.registration_id::text
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_payment_status_change
  AFTER UPDATE OF status ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.handle_payment_approved();

-- Auto-approve free event registrations
CREATE OR REPLACE FUNCTION public.handle_new_registration()
RETURNS TRIGGER AS $$
DECLARE
  event_fee NUMERIC;
BEGIN
  SELECT registration_fee INTO event_fee
  FROM public.events
  WHERE id = NEW.event_id;
  
  IF event_fee = 0 OR event_fee IS NULL THEN
    NEW.status := 'approved';
    NEW.payment_status := 'not_required';
    NEW.qr_token := encode(
      digest(
        NEW.id::text || NEW.event_id::text || NEW.user_id::text || NOW()::text,
        'sha256'
      ),
      'hex'
    );
    NEW.qr_generated := TRUE;
    NEW.approved_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_registration_created
  BEFORE INSERT ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_registration();

-- Notification on new registration (for organizer)
CREATE OR REPLACE FUNCTION public.notify_new_registration()
RETURNS TRIGGER AS $$
DECLARE
  organizer_id UUID;
  event_title TEXT;
  student_name TEXT;
BEGIN
  SELECT e.created_by, e.title INTO organizer_id, event_title
  FROM public.events e WHERE e.id = NEW.event_id;
  
  SELECT full_name INTO student_name
  FROM public.profiles WHERE id = NEW.user_id;
  
  PERFORM public.create_notification(
    organizer_id,
    'New Registration',
    student_name || ' registered for ' || event_title,
    'info',
    '/organizer/events/' || NEW.event_id::text
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_registration_notify
  AFTER INSERT ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_registration();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_history ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can view all profiles (basic info)"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- EVENTS POLICIES
-- ============================================
CREATE POLICY "Anyone can view published events"
  ON public.events FOR SELECT
  USING (status != 'draft' OR created_by = auth.uid());

CREATE POLICY "Organizers can create events"
  ON public.events FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'organizer')
  );

CREATE POLICY "Organizers can update their own events"
  ON public.events FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Organizers can delete their own draft events"
  ON public.events FOR DELETE
  USING (created_by = auth.uid() AND status = 'draft');

-- ============================================
-- REGISTRATIONS POLICIES
-- ============================================
CREATE POLICY "Users can view their own registrations"
  ON public.registrations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Organizers can view registrations for their events"
  ON public.registrations FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND created_by = auth.uid())
  );

CREATE POLICY "Students can create registrations"
  ON public.registrations FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Organizers can update registrations for their events"
  ON public.registrations FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND created_by = auth.uid())
  );

CREATE POLICY "Students can cancel their own registrations"
  ON public.registrations FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================
-- TEAMS POLICIES
-- ============================================
CREATE POLICY "Users can view teams they belong to"
  ON public.teams FOR SELECT
  USING (
    leader_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.registrations WHERE team_id = id AND user_id = auth.uid())
  );

CREATE POLICY "Organizers can view teams for their events"
  ON public.teams FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND created_by = auth.uid())
  );

CREATE POLICY "Students can create teams"
  ON public.teams FOR INSERT
  WITH CHECK (leader_id = auth.uid());

CREATE POLICY "Team leaders can update their teams"
  ON public.teams FOR UPDATE
  USING (leader_id = auth.uid());

-- ============================================
-- TEAM MEMBERS POLICIES
-- ============================================
CREATE POLICY "Users can view team members for their teams"
  ON public.team_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND leader_id = auth.uid())
  );

CREATE POLICY "Team leaders can manage members"
  ON public.team_members FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND leader_id = auth.uid())
    OR user_id = auth.uid()
  );

CREATE POLICY "Members can update their own membership"
  ON public.team_members FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Organizers can view team members for their events"
  ON public.team_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      JOIN public.events e ON e.id = t.event_id
      WHERE t.id = team_id AND e.created_by = auth.uid()
    )
  );

-- ============================================
-- PAYMENTS POLICIES
-- ============================================
CREATE POLICY "Users can view their own payments"
  ON public.payments FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Organizers can view payments for their events"
  ON public.payments FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND created_by = auth.uid())
  );

CREATE POLICY "Students can submit payments"
  ON public.payments FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Organizers can update payment status"
  ON public.payments FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND created_by = auth.uid())
  );

-- ============================================
-- VOLUNTEERS POLICIES
-- ============================================
CREATE POLICY "Users can view their own volunteer applications"
  ON public.volunteers FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Organizers can view volunteers for their events"
  ON public.volunteers FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND created_by = auth.uid())
  );

CREATE POLICY "Volunteers can apply"
  ON public.volunteers FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Organizers can update volunteer status"
  ON public.volunteers FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND created_by = auth.uid())
  );

-- ============================================
-- VOLUNTEER TASKS POLICIES
-- ============================================
CREATE POLICY "Volunteers can view their assigned tasks"
  ON public.volunteer_tasks FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.volunteers WHERE id = volunteer_id AND user_id = auth.uid())
  );

CREATE POLICY "Organizers can manage tasks for their events"
  ON public.volunteer_tasks FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND created_by = auth.uid())
  );

CREATE POLICY "Volunteers can update their task status"
  ON public.volunteer_tasks FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.volunteers WHERE id = volunteer_id AND user_id = auth.uid())
  );

-- ============================================
-- ATTENDANCE POLICIES
-- ============================================
CREATE POLICY "Users can view their own attendance"
  ON public.attendance FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Organizers can view attendance for their events"
  ON public.attendance FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND created_by = auth.uid())
  );

CREATE POLICY "Volunteers can record attendance"
  ON public.attendance FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.volunteers v
      WHERE v.user_id = auth.uid()
        AND v.event_id = event_id
        AND v.application_status = 'approved'
    )
    OR EXISTS (
      SELECT 1 FROM public.events WHERE id = event_id AND created_by = auth.uid()
    )
  );

-- ============================================
-- CERTIFICATES POLICIES
-- ============================================
CREATE POLICY "Users can view their own certificates"
  ON public.certificates FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Organizers can manage certificates for their events"
  ON public.certificates FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND created_by = auth.uid())
  );

CREATE POLICY "Public certificate verification"
  ON public.certificates FOR SELECT
  USING (true);

-- ============================================
-- NOTIFICATIONS POLICIES
-- ============================================
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- ANNOUNCEMENTS POLICIES
-- ============================================
CREATE POLICY "Anyone can view announcements for published events"
  ON public.announcements FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND status != 'draft')
  );

CREATE POLICY "Organizers can create announcements for their events"
  ON public.announcements FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND created_by = auth.uid())
  );

-- ============================================
-- EVENT FAQs POLICIES
-- ============================================
CREATE POLICY "Anyone can view FAQs for published events"
  ON public.event_faqs FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND status != 'draft')
    OR EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND created_by = auth.uid())
  );

CREATE POLICY "Organizers can manage FAQs for their events"
  ON public.event_faqs FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND created_by = auth.uid())
  );

-- ============================================
-- EVENT GALLERY POLICIES
-- ============================================
CREATE POLICY "Anyone can view gallery for published events"
  ON public.event_gallery FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND status != 'draft')
  );

CREATE POLICY "Organizers can manage gallery for their events"
  ON public.event_gallery FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND created_by = auth.uid())
  );

-- ============================================
-- FEEDBACK POLICIES
-- ============================================
CREATE POLICY "Users can view feedback for completed events"
  ON public.feedback FOR SELECT
  USING (true);

CREATE POLICY "Users can submit feedback"
  ON public.feedback FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- AUDIT LOGS POLICIES
-- ============================================
CREATE POLICY "Users can view their own audit logs"
  ON public.audit_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can create audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

-- ============================================
-- AI HISTORY POLICIES
-- ============================================
CREATE POLICY "Users can view their own AI history"
  ON public.ai_history FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create AI history"
  ON public.ai_history FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- STORAGE BUCKETS (run in Supabase dashboard)
-- ============================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('profile-images', 'profile-images', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('event-posters', 'event-posters', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('event-banners', 'event-banners', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('payment-screenshots', 'payment-screenshots', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('certificates', 'certificates', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('gallery', 'gallery', true);
