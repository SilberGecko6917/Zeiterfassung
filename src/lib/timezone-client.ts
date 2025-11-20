/**
 * Client-side timezone utilities
 * Safe for use in client components
 */

import { 
  toZonedTime, 
  fromZonedTime, 
  formatInTimeZone 
} from 'date-fns-tz';
import { parseISO } from 'date-fns';
import { de, type Locale } from 'date-fns/locale';
import { SUPPORTED_TIMEZONES, type SupportedTimezone } from './timezone-constants';

export { SUPPORTED_TIMEZONES, type SupportedTimezone };

/**
 * Validates if a timezone string is supported
 */
export function isValidTimezone(timezone: string): timezone is SupportedTimezone {
  return SUPPORTED_TIMEZONES.includes(timezone as SupportedTimezone);
}

/**
 * Get current UTC date
 */
export function nowUTC(): Date {
  return new Date();
}

/**
 * Convert a date to UTC (for storing in database)
 * @param date - Date in user's timezone
 * @param timezone - User's timezone (e.g., 'Europe/Berlin')
 * @returns Date object representing the same moment in UTC
 */
export function toUTC(date: Date | string, timezone: string = 'UTC'): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return fromZonedTime(dateObj, timezone);
}

/**
 * Convert a UTC date to user's timezone (for display)
 * @param utcDate - Date in UTC from database
 * @param timezone - User's timezone (e.g., 'Europe/Berlin')
 * @returns Date object in user's timezone
 */
export function fromUTC(utcDate: Date | string, timezone: string = 'UTC'): Date {
  const dateObj = typeof utcDate === 'string' ? parseISO(utcDate) : utcDate;
  return toZonedTime(dateObj, timezone);
}

/**
 * Format a UTC date in user's timezone
 * @param utcDate - Date in UTC from database
 * @param formatStr - Format string (e.g., 'dd.MM.yyyy HH:mm')
 * @param timezone - User's timezone
 * @param locale - Date locale (defaults to German)
 * @returns Formatted date string
 */
export function formatInUserTimezone(
  utcDate: Date | string,
  formatStr: string,
  timezone: string = 'UTC',
  locale: Locale = de
): string {
  const dateObj = typeof utcDate === 'string' ? parseISO(utcDate) : utcDate;
  return formatInTimeZone(dateObj, timezone, formatStr, { locale });
}


/**
 * Parse a date string from user input in their timezone and convert to UTC
 * @param dateStr - Date string in format 'yyyy-MM-dd'
 * @param timeStr - Time string in format 'HH:mm'
 * @param timezone - User's timezone
 * @returns UTC Date object
 */
export function parseUserDateTimeToUTC(
  dateStr: string,
  timeStr: string,
  timezone: string = 'UTC'
): Date {
  const localDateTimeStr = `${dateStr}T${timeStr}:00`;
  const localDate = parseISO(localDateTimeStr);
  return fromZonedTime(localDate, timezone);
}

/**
 * Get start of day in user's timezone, converted to UTC
 * @param date - Date to get start of day for (can be Date object or 'yyyy-MM-dd' string)
 * @param timezone - User's timezone
 * @returns UTC Date object representing start of day in user's timezone
 */
export function startOfDayInTimezone(date: Date | string, timezone: string = 'UTC'): Date {
  let dateStr: string;
  
  if (typeof date === 'string') {
    // If it's already a date string, use it directly
    dateStr = date;
  } else {
    // If it's a Date object, format it to yyyy-MM-dd in the target timezone
    const zonedDate = toZonedTime(date, timezone);
    const year = zonedDate.getFullYear();
    const month = String(zonedDate.getMonth() + 1).padStart(2, '0');
    const day = String(zonedDate.getDate()).padStart(2, '0');
    dateStr = `${year}-${month}-${day}`;
  }
  
  // Create a date string at midnight in the user's timezone
  const localMidnight = `${dateStr}T00:00:00`;
  const localDate = parseISO(localMidnight);
  
  // Convert this local midnight to UTC
  return fromZonedTime(localDate, timezone);
}

/**
 * Get end of day in user's timezone, converted to UTC
 * @param date - Date to get end of day for (can be Date object or 'yyyy-MM-dd' string)
 * @param timezone - User's timezone
 * @returns UTC Date object representing end of day in user's timezone
 */
export function endOfDayInTimezone(date: Date | string, timezone: string = 'UTC'): Date {
  let dateStr: string;
  
  if (typeof date === 'string') {
    // If it's already a date string, use it directly
    dateStr = date;
  } else {
    // If it's a Date object, format it to yyyy-MM-dd in the target timezone
    const zonedDate = toZonedTime(date, timezone);
    const year = zonedDate.getFullYear();
    const month = String(zonedDate.getMonth() + 1).padStart(2, '0');
    const day = String(zonedDate.getDate()).padStart(2, '0');
    dateStr = `${year}-${month}-${day}`;
  }
  
  // Create a date string at end of day in the user's timezone
  const localEndOfDay = `${dateStr}T23:59:59.999`;
  const localDate = parseISO(localEndOfDay);
  
  // Convert this local end of day to UTC
  return fromZonedTime(localDate, timezone);
}

/**
 * Calculate duration between two dates in seconds
 */
export function calculateDuration(startDate: Date | string, endDate: Date | string): number {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  return Math.floor((end.getTime() - start.getTime()) / 1000);
}

/**
 * Format duration in seconds to human readable format (HH:MM)
 */
export function formatDuration(durationInSeconds: number): string {
  const hours = Math.floor(durationInSeconds / 3600);
  const minutes = Math.floor((durationInSeconds % 3600) / 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Format date for display
 */
export function formatDateInTimezone(
  date: Date | string,
  timezone: string = 'UTC',
  formatStr: string = 'dd.MM.yyyy'
): string {
  return formatInUserTimezone(date, formatStr, timezone);
}

/**
 * Format time for display
 */
export function formatTimeInTimezone(
  date: Date | string,
  timezone: string = 'UTC',
  use24Hour: boolean = true
): string {
  const formatStr = use24Hour ? 'HH:mm' : 'hh:mm a';
  return formatInUserTimezone(date, formatStr, timezone);
}

/**
 * Get timezone offset string (e.g., '+01:00', '-05:00')
 */
export function getTimezoneOffset(timezone: string, date: Date = new Date()): string {
  return formatInTimeZone(date, timezone, 'xxx', { locale: de });
}

/**
 * Get timezone display name
 */
export function getTimezoneDisplayName(timezone: string): string {
  const offset = getTimezoneOffset(timezone);
  return `${timezone} (UTC${offset})`;
}


