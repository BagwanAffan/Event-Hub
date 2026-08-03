-- Migration: Fix Team & Team Members RLS Recursion
-- Date: 2026-07-31

-- 1. Drop existing recursive SELECT policies
DROP POLICY IF EXISTS "Users can view teams they belong to" ON public.teams;
DROP POLICY IF EXISTS "Users can view team members for their teams" ON public.team_members;

-- 2. Re-create non-recursive SELECT policy for public.teams
-- Instead of querying team_members (which checks teams SELECT), check the independent registrations table
CREATE POLICY "Users can view teams they belong to"
  ON public.teams FOR SELECT
  USING (
    leader_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.registrations 
      WHERE registrations.team_id = teams.id 
        AND registrations.user_id = auth.uid()
    )
  );

-- 3. Re-create SELECT policy for public.team_members
-- Queries the teams table which now evaluates cleanly without cyclic recursion
CREATE POLICY "Users can view team members for their teams"
  ON public.team_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.teams 
      WHERE teams.id = team_members.team_id 
        AND teams.leader_id = auth.uid()
    )
  );
