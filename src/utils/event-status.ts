export type EventTimeStatus = 'upcoming' | 'ongoing' | 'ended' | 'draft' | 'cancelled' | 'disabled';

export interface MinimalEvent {
  id?: string;
  start_date?: string | Date | null;
  end_date?: string | Date | null;
  registration_deadline?: string | Date | null;
  status?: string | null;
  is_disabled?: boolean;
  max_participants?: number | null;
  registered_count?: number | null;
  registrationCount?: number | null;
}

export interface EventStatusDetails {
  timeStatus: 'upcoming' | 'ongoing' | 'ended';
  fullStatus: EventTimeStatus;
  badgeLabel: string;
  badgeVariant: 'default' | 'secondary' | 'outline' | 'destructive';
  canRegister: boolean;
  buttonText: string;
  deadlinePassed: boolean;
  isFull: boolean;
  isUpcoming: boolean;
  isOngoing: boolean;
  isEnded: boolean;
}

/**
 * Safely parses any date input (ISO string, datetime-local, date-only, Date instance)
 * into a valid JavaScript Date object in local time context without timezone shifts.
 */
export function parseEventDate(input: string | Date | null | undefined): Date | null {
  if (!input) return null;
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }
  
  let str = String(input).trim();
  if (!str) return null;

  // Handle YYYY-MM-DD date-only strings by treating as local start of day
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d, 0, 0, 0, 0);
  }

  // Replace space between date and time with T if formatted like "2026-08-08 10:00:00"
  if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}/.test(str)) {
    str = str.replace(' ', 'T');
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return d;
  }
  return null;
}

/**
 * Gets the effective end date for an event.
 * If end_date is missing or invalid, falls back to 2 hours after start_date or end of start_date's day.
 */
export function getEffectiveEndDate(
  startInput?: string | Date | null,
  endInput?: string | Date | null
): Date | null {
  const endDate = parseEventDate(endInput);
  if (endDate) return endDate;

  const startDate = parseEventDate(startInput);
  if (!startDate) return null;

  // Fallback: 2 hours after start date, or end of start date's day (whichever is later)
  const defaultTwoHours = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
  const endOfDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 23, 59, 59, 999);

  return defaultTwoHours > endOfDay ? defaultTwoHours : endOfDay;
}

/**
 * Calculates the core time status: 'upcoming' | 'ongoing' | 'ended'
 */
export function getEventTimeStatus(
  event: MinimalEvent,
  now: Date = new Date()
): 'upcoming' | 'ongoing' | 'ended' {
  if (event.status === 'completed') return 'ended';

  const startDate = parseEventDate(event.start_date);
  if (!startDate) return 'upcoming'; // Default to upcoming if no date set yet

  const endDate = getEffectiveEndDate(event.start_date, event.end_date);

  const nowMs = now.getTime();
  const startMs = startDate.getTime();

  if (nowMs < startMs) {
    return 'upcoming';
  }

  if (endDate) {
    const endMs = endDate.getTime();
    if (nowMs <= endMs) {
      return 'ongoing';
    } else {
      return 'ended';
    }
  }

  return 'ongoing';
}

/**
 * Gets comprehensive details about event status, badges, and registration eligibility.
 */
export function getEventStatusDetails(
  event: MinimalEvent,
  now: Date = new Date()
): EventStatusDetails {
  const timeStatus = getEventTimeStatus(event, now);

  const isUpcoming = timeStatus === 'upcoming';
  const isOngoing = timeStatus === 'ongoing';
  const isEnded = timeStatus === 'ended';

  const regDeadline = parseEventDate(event.registration_deadline);
  const deadlinePassed = regDeadline ? now.getTime() > regDeadline.getTime() : false;

  const currentRegCount = event.registered_count ?? event.registrationCount ?? 0;
  const isFull = Boolean(
    event.max_participants &&
    event.max_participants > 0 &&
    currentRegCount >= event.max_participants
  );

  const isDisabled = Boolean(event.is_disabled || event.status === 'disabled');
  const isCancelled = event.status === 'cancelled';
  const isDraft = event.status === 'draft';

  let fullStatus: EventTimeStatus = timeStatus;
  if (isDisabled) fullStatus = 'disabled';
  else if (isCancelled) fullStatus = 'cancelled';
  else if (isDraft) fullStatus = 'draft';

  // Badge label and variant
  let badgeLabel = 'Upcoming';
  let badgeVariant: EventStatusDetails['badgeVariant'] = 'default';

  if (isDraft) {
    badgeLabel = 'Draft';
    badgeVariant = 'secondary';
  } else if (isCancelled) {
    badgeLabel = 'Cancelled';
    badgeVariant = 'destructive';
  } else if (isDisabled) {
    badgeLabel = 'Disabled';
    badgeVariant = 'destructive';
  } else if (isEnded) {
    badgeLabel = 'Completed';
    badgeVariant = 'secondary';
  } else if (isOngoing) {
    badgeLabel = 'Ongoing';
    badgeVariant = 'default';
  } else if (deadlinePassed) {
    badgeLabel = 'Registration Closed';
    badgeVariant = 'secondary';
  } else if (isFull) {
    badgeLabel = 'Full';
    badgeVariant = 'secondary';
  } else {
    badgeLabel = 'Open';
    badgeVariant = 'default';
  }

  // Registration eligibility
  const canRegister = (isUpcoming || isOngoing) &&
    !isDraft &&
    !isDisabled &&
    !isCancelled &&
    !isEnded &&
    !deadlinePassed &&
    !isFull;

  // Button text determination
  let buttonText = 'Register Now';
  if (isEnded) {
    buttonText = 'Event Ended';
  } else if (deadlinePassed) {
    buttonText = 'Registration Closed';
  } else if (isFull) {
    buttonText = 'Event Full';
  } else if (isCancelled) {
    buttonText = 'Event Cancelled';
  } else if (isDisabled || isDraft) {
    buttonText = 'Registration Unavailable';
  } else {
    buttonText = 'Register Now';
  }

  return {
    timeStatus,
    fullStatus,
    badgeLabel,
    badgeVariant,
    canRegister,
    buttonText,
    deadlinePassed,
    isFull,
    isUpcoming,
    isOngoing,
    isEnded,
  };
}
