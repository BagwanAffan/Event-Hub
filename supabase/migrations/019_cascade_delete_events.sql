-- ============================================
-- MIGRATION 019: Foreign Key Cascade Deletes for Events
-- ============================================

DO $$
BEGIN
  -- 1. Registrations
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'registrations_event_id_fkey') THEN
    ALTER TABLE public.registrations DROP CONSTRAINT registrations_event_id_fkey;
  END IF;
  ALTER TABLE public.registrations ADD CONSTRAINT registrations_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

  -- 2. Teams
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'teams_event_id_fkey') THEN
    ALTER TABLE public.teams DROP CONSTRAINT teams_event_id_fkey;
  END IF;
  ALTER TABLE public.teams ADD CONSTRAINT teams_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

  -- 3. Volunteers
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'volunteers_event_id_fkey') THEN
    ALTER TABLE public.volunteers DROP CONSTRAINT volunteers_event_id_fkey;
  END IF;
  ALTER TABLE public.volunteers ADD CONSTRAINT volunteers_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

  -- 4. Volunteer Tasks
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'volunteer_tasks_event_id_fkey') THEN
    ALTER TABLE public.volunteer_tasks DROP CONSTRAINT volunteer_tasks_event_id_fkey;
  END IF;
  ALTER TABLE public.volunteer_tasks ADD CONSTRAINT volunteer_tasks_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

  -- 5. Attendance
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'attendance_event_id_fkey') THEN
    ALTER TABLE public.attendance DROP CONSTRAINT attendance_event_id_fkey;
  END IF;
  ALTER TABLE public.attendance ADD CONSTRAINT attendance_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

  -- 6. Certificates
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'certificates_event_id_fkey') THEN
    ALTER TABLE public.certificates DROP CONSTRAINT certificates_event_id_fkey;
  END IF;
  ALTER TABLE public.certificates ADD CONSTRAINT certificates_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

  -- 7. Payments
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'payments_event_id_fkey') THEN
    ALTER TABLE public.payments DROP CONSTRAINT payments_event_id_fkey;
  END IF;
  ALTER TABLE public.payments ADD CONSTRAINT payments_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

  -- 8. Feedback
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'feedback_event_id_fkey') THEN
    ALTER TABLE public.feedback DROP CONSTRAINT feedback_event_id_fkey;
  END IF;
  ALTER TABLE public.feedback ADD CONSTRAINT feedback_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

  -- 9. Announcements
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'announcements_event_id_fkey') THEN
    ALTER TABLE public.announcements DROP CONSTRAINT announcements_event_id_fkey;
  END IF;
  ALTER TABLE public.announcements ADD CONSTRAINT announcements_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

  -- 10. Event FAQs
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'event_faqs_event_id_fkey') THEN
    ALTER TABLE public.event_faqs DROP CONSTRAINT event_faqs_event_id_fkey;
  END IF;
  ALTER TABLE public.event_faqs ADD CONSTRAINT event_faqs_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

  -- 11. Event Galleries
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'event_galleries_event_id_fkey') THEN
    ALTER TABLE public.event_galleries DROP CONSTRAINT event_galleries_event_id_fkey;
  END IF;
  ALTER TABLE public.event_galleries ADD CONSTRAINT event_galleries_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;
