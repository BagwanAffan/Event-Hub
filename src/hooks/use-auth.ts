'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types/database.types';
import { notificationService } from '@/services/notification-service';
import { checkProfileCompletion } from '@/hooks/use-profile-completion';
import { dataSync } from '@/lib/data-sync';

const supabase = createClient();
const PROFILE_SYNC_SKIP_MS = 1000 * 60 * 5; // Throttle sync for 5 min per profile id
const lastSyncAtMap: Record<string, number> = {};

// Global Shared Auth State Singleton
interface GlobalAuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
}

let globalAuthState: GlobalAuthState = {
  user: null,
  profile: null,
  loading: true,
  initialized: false,
};

const listeners = new Set<() => void>();

function notifyAuthStateListeners() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (err) {
      console.error('[useAuth] Listener error:', err);
    }
  });
}

async function fetchGlobalProfile(userId: string) {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      globalAuthState.profile = data as Profile;
    }
  } catch (err) {
    console.error('[useAuth] fetchGlobalProfile error:', err);
  }
}

async function initGlobalAuth() {
  if (globalAuthState.initialized || typeof window === 'undefined') return;
  globalAuthState.initialized = true;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    globalAuthState.user = user;
    if (user) {
      await fetchGlobalProfile(user.id);
    }
  } catch (err) {
    console.error('[useAuth] initGlobalAuth error:', err);
  } finally {
    globalAuthState.loading = false;
    notifyAuthStateListeners();
  }

  // Subscribe to auth state changes
  supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
    const newUser = session?.user ?? null;
    globalAuthState.user = newUser;
    if (newUser) {
      await fetchGlobalProfile(newUser.id);
    } else {
      globalAuthState.profile = null;
    }
    globalAuthState.loading = false;
    notifyAuthStateListeners();
    dataSync.notify('profile');
  });

  // Subscribe to dataSync profile updates
  dataSync.subscribe('profile', async () => {
    if (globalAuthState.user?.id) {
      await fetchGlobalProfile(globalAuthState.user.id);
      notifyAuthStateListeners();
    }
  });
}

export function useAuth() {
  const [state, setState] = useState<GlobalAuthState>(globalAuthState);
  const router = useRouter();

  useEffect(() => {
    initGlobalAuth();

    const handleUpdate = () => {
      setState({ ...globalAuthState });
    };

    listeners.add(handleUpdate);
    // Sync state immediately in case it initialized before mount
    handleUpdate();

    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  const refreshProfile = useCallback(async () => {
    const targetId = globalAuthState.user?.id || globalAuthState.profile?.id;
    if (targetId) {
      await fetchGlobalProfile(targetId);
      notifyAuthStateListeners();
    }
  }, []);

  useEffect(() => {
    const p = state.profile;
    if (!p) return;
    (async () => {
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
    })();
  }, [state.profile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    globalAuthState.user = null;
    globalAuthState.profile = null;
    globalAuthState.loading = false;
    notifyAuthStateListeners();
    dataSync.notify('profile');
    router.push('/login');
  };

  return {
    user: state.user,
    profile: state.profile,
    loading: state.loading,
    signOut,
    refreshProfile,
  };
}
