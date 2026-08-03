'use client';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useRef } from 'react';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types/database.types';
import { notificationService } from '@/services/notification-service';
import { checkProfileCompletion } from '@/hooks/use-profile-completion';

const supabase = createClient();
const PROFILE_SYNC_SKIP_MS = 1000 * 60 * 5; // Throttle sync for 5 min per profile id

const lastSyncAtMap: Record<string, number> = {};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const initializedRef = useRef(false);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) setProfile(data as Profile);
  }, []);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const ensureProfileReminderIfNeeded = async (p: Profile) => {
      const { isComplete } = checkProfileCompletion(p);
      if (isComplete) {
        try { await notificationService.removeProfileReminder(p.id); } catch { /* noop */ }
        return;
      }
      const now = Date.now();
      const last = lastSyncAtMap[p.id] || 0;
      if (now - last < PROFILE_SYNC_SKIP_MS) return;
      lastSyncAtMap[p.id] = now;
      try {
        await notificationService.ensureProfileReminder(p);
      } catch (err) {
        console.warn('[use-auth] ensure profile reminder failed:', err);
      }
    };

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await fetchProfile(user.id);
      }
      setLoading(false);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: any, session: any) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { isComplete } = checkProfileCompletion(profile);
      if (isComplete) {
        try { await notificationService.removeProfileReminder(profile.id); } catch { /* noop */ }
        return;
      }
      const now = Date.now();
      const last = lastSyncAtMap[profile.id] || 0;
      if (now - last < PROFILE_SYNC_SKIP_MS) return;
      lastSyncAtMap[profile.id] = now;
      try {
        await notificationService.ensureProfileReminder(profile);
      } catch (err) {
        console.warn('[use-auth] ensure profile reminder failed:', err);
      }
    })();
  }, [profile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    router.push('/login');
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return { user, profile, loading, signOut, refreshProfile };
}
