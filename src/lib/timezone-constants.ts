/**
 * Shared timezone constants
 */

export const SUPPORTED_TIMEZONES = [
  'UTC',
  'Europe/Berlin',
  'Europe/London',
  'Europe/Paris',
  'Europe/Rome',
  'Europe/Vienna',
  'Europe/Zurich',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Dubai',
  'Australia/Sydney',
] as const;

export type SupportedTimezone = typeof SUPPORTED_TIMEZONES[number];
