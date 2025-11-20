import { getSetting } from "@/lib/settings";
import { getUserTimezone } from "@/lib/server/timezone";
import { formatDateInTimezone, formatTimeInTimezone, formatDuration as formatDurationUtil } from "@/lib/timezone";

/**
 * Format a UTC date for display in user's timezone
 * Uses server-side user timezone preference
 */
export async function formatDate(date: Date | string): Promise<string> {
  const dateFormat = await getSetting<string>("date_format");
  const timezone = await getUserTimezone();
  return formatDateInTimezone(date, timezone, dateFormat);
}

/**
 * Format a UTC time for display in user's timezone
 * Uses server-side user timezone preference
 */
export async function formatTime(date: Date | string): Promise<string> {
  const timeFormat = await getSetting<string>("time_format");
  const timezone = await getUserTimezone();
  const use24Hour = timeFormat !== "12h";
  return formatTimeInTimezone(date, timezone, use24Hour);
}

/**
 * Format duration in seconds to HH:MM format
 */
export function formatDuration(durationInSeconds: number): string {
  return formatDurationUtil(durationInSeconds);
}