import { format, formatDistanceToNow, isAfter, isBefore } from 'date-fns';

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'MMM dd, yyyy');
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'MMM dd, yyyy, h:mm a');
}

export function formatTime(date: string | Date): string {
  return format(new Date(date), 'h:mm a');
}

export function formatRelative(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function isUpcoming(date: string | Date): boolean {
  return isAfter(new Date(date), new Date());
}

export function isPast(date: string | Date): boolean {
  return isBefore(new Date(date), new Date());
}

export function formatDateRange(start: string | Date, end: string | Date): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  if (startDate.toDateString() === endDate.toDateString()) {
    return `${formatDate(startDate)} ${formatTime(startDate)} - ${formatTime(endDate)}`;
  }
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}
