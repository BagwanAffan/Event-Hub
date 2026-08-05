import React from 'react';

export interface NotificationOption {
  key: string;
  title: string;
  description: string;
  iconName: 'Mail' | 'Sparkles' | 'Calendar' | 'Bell' | 'User' | 'Info' | 'ShieldCheck' | 'Check' | 'Lock';
}

export type UserRole = 'student' | 'organizer' | 'volunteer' | 'admin';

export const ROLE_NOTIFICATION_OPTIONS: Record<UserRole, NotificationOption[]> = {
  student: [
    {
      key: 'event_updates',
      title: 'Event Updates',
      description: 'Receive notifications for event registrations, reminders, and cancellations',
      iconName: 'Calendar',
    },
    {
      key: 'certificates_qr',
      title: 'Certificates & QR Passes',
      description: 'Get notified when entry QR passes and digital certificates are issued',
      iconName: 'Sparkles',
    },
    {
      key: 'team_announcements',
      title: 'Team & Organizer Announcements',
      description: 'Receive team invitations and broadcasts from event organizers',
      iconName: 'Bell',
    },
    {
      key: 'account_security',
      title: 'Account & Security Alerts',
      description: 'Get alerts for profile updates, password changes, and new logins',
      iconName: 'Lock',
    },
  ],
  organizer: [
    {
      key: 'registrations_payments',
      title: 'Registrations & Payments',
      description: 'Get notified for new event registrations, cancellations, and payment verifications',
      iconName: 'ShieldCheck',
    },
    {
      key: 'volunteer_updates',
      title: 'Volunteer Updates',
      description: 'Receive alerts for volunteer applications, duty schedules, and status changes',
      iconName: 'User',
    },
    {
      key: 'event_announcements',
      title: 'Event & Admin Announcements',
      description: 'Get notified for admin event approvals, report generation, and system broadcasts',
      iconName: 'Bell',
    },
    {
      key: 'account_security',
      title: 'Account & Security Alerts',
      description: 'Receive security alerts for password changes and account activity',
      iconName: 'Lock',
    },
  ],
  volunteer: [
    {
      key: 'task_assignments',
      title: 'Task Assignments',
      description: 'Receive notifications for new volunteer assignments, tasks, and shift updates',
      iconName: 'Check',
    },
    {
      key: 'event_updates',
      title: 'Event Updates',
      description: 'Get notified about event reporting times, scanning reminders, and schedule changes',
      iconName: 'Calendar',
    },
    {
      key: 'organizer_announcements',
      title: 'Organizer Announcements',
      description: 'Receive shift broadcasts and instructions from event organizers',
      iconName: 'Bell',
    },
    {
      key: 'account_security',
      title: 'Account & Security Alerts',
      description: 'Receive alerts for volunteer profile updates and security activity',
      iconName: 'Lock',
    },
  ],
  admin: [
    {
      key: 'organizer_approvals',
      title: 'Organizer Approval Requests',
      description: 'Get notified when new organizers apply or submit verification documents',
      iconName: 'ShieldCheck',
    },
    {
      key: 'event_management',
      title: 'Event Management Alerts',
      description: 'Receive alerts for new event proposals, deletions, status changes, and featured events',
      iconName: 'Calendar',
    },
    {
      key: 'platform_system',
      title: 'Platform/System Alerts',
      description: 'Get notified for user reports, platform analytics reports, and system warnings',
      iconName: 'Info',
    },
    {
      key: 'account_security',
      title: 'Account & Security Alerts',
      description: 'Receive critical security notifications and administrative credential alerts',
      iconName: 'Lock',
    },
  ],
};

export function getStorageKey(userId?: string, role?: string): string {
  if (userId) return `eventhub_notif_prefs_${userId}`;
  if (role) return `eventhub_notif_prefs_role_${role}`;
  return `eventhub_notif_prefs_default`;
}

export function getDefaultPreferencesForRole(role: UserRole): Record<string, boolean> {
  const options = ROLE_NOTIFICATION_OPTIONS[role] || ROLE_NOTIFICATION_OPTIONS.student;
  const prefs: Record<string, boolean> = {};
  options.forEach((opt) => {
    prefs[opt.key] = true;
  });
  return prefs;
}

export function loadNotificationPreferences(userId?: string, role: UserRole = 'student'): Record<string, boolean> {
  const defaults = getDefaultPreferencesForRole(role);
  if (typeof window === 'undefined') return defaults;
  
  try {
    const key = getStorageKey(userId, role);
    const stored = window.localStorage.getItem(key);
    if (!stored) return defaults;
    const parsed = JSON.parse(stored);
    return { ...defaults, ...parsed };
  } catch (err) {
    console.error('Error loading notification preferences:', err);
    return defaults;
  }
}

export function saveNotificationPreferences(userId: string | undefined, role: UserRole, prefs: Record<string, boolean>): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getStorageKey(userId, role);
    window.localStorage.setItem(key, JSON.stringify(prefs));
  } catch (err) {
    console.error('Error saving notification preferences:', err);
  }
}

export function isNotificationCategoryEnabled(userId: string | undefined, role: UserRole | undefined, categoryKey: string): boolean {
  const prefs = loadNotificationPreferences(userId, role || 'student');
  return prefs[categoryKey] !== false;
}

export function inferNotificationCategory(title: string, role?: UserRole): string | null {
  const lower = title.toLowerCase();

  if (lower.includes('security') || lower.includes('password') || lower.includes('profile') || lower.includes('account')) {
    return 'account_security';
  }

  if (role === 'organizer') {
    if (lower.includes('registration') || lower.includes('payment')) return 'registrations_payments';
    if (lower.includes('volunteer') || lower.includes('task')) return 'volunteer_updates';
    if (lower.includes('event') || lower.includes('announcement') || lower.includes('admin')) return 'event_announcements';
  } else if (role === 'volunteer') {
    if (lower.includes('task') || lower.includes('assignment')) return 'task_assignments';
    if (lower.includes('event') || lower.includes('schedule') || lower.includes('scan') || lower.includes('reminder')) return 'event_updates';
    if (lower.includes('announcement') || lower.includes('organizer')) return 'organizer_announcements';
  } else if (role === 'admin') {
    if (lower.includes('organizer') || lower.includes('approval') || lower.includes('verification')) return 'organizer_approvals';
    if (lower.includes('event') || lower.includes('featured')) return 'event_management';
    if (lower.includes('system') || lower.includes('report') || lower.includes('analytics') || lower.includes('warning') || lower.includes('error')) return 'platform_system';
  } else {
    // Default student matching
    if (lower.includes('registration') || lower.includes('reminder') || lower.includes('cancellation') || lower.includes('event')) return 'event_updates';
    if (lower.includes('certificate') || lower.includes('qr') || lower.includes('pass')) return 'certificates_qr';
    if (lower.includes('team') || lower.includes('announcement') || lower.includes('organizer')) return 'team_announcements';
  }

  return null;
}
