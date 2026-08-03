import type { UserRole, EventStatus, RegistrationStatus, PaymentStatus } from '@/types/database.types';

export const APP_NAME = 'EventHub';
export const APP_TAGLINE = 'One Platform for Every Campus Event.';
export const APP_DESCRIPTION = 'Centralized Event and Volunteer Management Platform for colleges.';

export const ROLES: UserRole[] = ['student', 'organizer', 'volunteer'];

export const EVENT_CATEGORIES = [
  'technical',
  'cultural',
  'sports',
  'workshop',
  'seminar',
  'hackathon',
  'competition',
  'social',
  'other',
] as const;

export const EVENT_STATUSES: EventStatus[] = [
  'draft',
  'published',
  'ongoing',
  'completed',
  'cancelled',
];

export const REGISTRATION_STATUSES: RegistrationStatus[] = [
  'pending',
  'approved',
  'rejected',
  'cancelled',
];

export const PAYMENT_STATUSES: PaymentStatus[] = [
  'pending',
  'verified',
  'rejected',
  'refunded',
];

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const ITEMS_PER_PAGE = 10;
export const SIDEBAR_WIDTH = 280;
export const SIDEBAR_COLLAPSED_WIDTH = 80;
export const NAV_HEIGHT = 72;
