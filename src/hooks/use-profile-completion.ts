'use client';
import type { Profile } from '@/types/database.types';

export function checkProfileCompletion(profile: Profile | null | undefined): {
  isComplete: boolean;
  missingFields: string[];
} {
  if (!profile) return { isComplete: true, missingFields: [] };

  if (profile.role === 'organizer') {
    const missing: string[] = [];
    if (!profile.full_name || !profile.full_name.trim()) missing.push('Club / Organization Head Name');
    if (!profile.club_name || !profile.club_name.trim()) missing.push('Club / Organization Name');
    if (!profile.college || !profile.college.trim()) missing.push('College / Institution');
    if (!profile.organization_type || !profile.organization_type.trim()) missing.push('Type of Club / Organization');
    return {
      isComplete: missing.length === 0,
      missingFields: missing,
    };
  }

  const missingFields: string[] = [];
  if (!profile.full_name || profile.full_name.trim().length === 0) {
    missingFields.push('Full Name');
  }
  if (!profile.phone || profile.phone.trim().length === 0) {
    missingFields.push('Phone Number');
  }
  if (!profile.department || profile.department.trim().length === 0) {
    missingFields.push('Department');
  }
  if (!profile.year || profile.year.trim().length === 0) {
    missingFields.push('Year');
  }
  if (!profile.profile_picture) {
    missingFields.push('Profile Picture (Recommended)');
  }
  const requiredOnly = missingFields.filter(f => !f.includes('Recommended'));
  return {
    isComplete: requiredOnly.length === 0,
    missingFields,
  };
}

export function useProfileCompletion(profile: Profile | null) {
  return checkProfileCompletion(profile);
}

export function getRequiredMissingFields(profile: Profile | null | undefined): string[] {
  const { missingFields } = checkProfileCompletion(profile);
  return missingFields.filter(f => !f.includes('Recommended'));
}

export function requireProfileComplete(
  profile: Profile | null | undefined,
  actionName: string,
  options?: {
    onBlocked?: (missingFields: string[]) => void;
  }
): boolean {
  const requiredMissing = getRequiredMissingFields(profile);
  if (requiredMissing.length > 0) {
    options?.onBlocked?.(requiredMissing);
    return false;
  }
  return true;
}

export const PROFILE_REMINDER_TITLE = 'Complete Your Profile';
export const PROFILE_REMINDER_ACTION_PREFIX = '/profile-reminder';
