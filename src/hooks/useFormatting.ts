"use client";

import { useCallback } from "react";
import { useSetting } from "@/hooks/useSettings";
import { useTimezone } from "@/hooks/useTimezone";
import { formatDateInTimezone, formatTimeInTimezone, formatDuration as formatDurationUtil } from "@/lib/timezone-client";

export function useFormatting() {
  const { value: dateFormat, loading: dateFormatLoading } = useSetting("date_format", "dd.MM.yyyy");
  const { value: timeFormat, loading: timeFormatLoading } = useSetting("time_format", "24h");
  const { timezone, loading: timezoneLoading } = useTimezone();
  
  const formatDate = useCallback((date: Date | string | null | undefined) => {
    if (!date) return "";
    try {
      return formatDateInTimezone(date, timezone, dateFormat as string);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  }, [dateFormat, timezone]);
  
  const formatTime = useCallback((time: Date | string | null | undefined) => {
    if (!time) return "";
    try {
      const use24Hour = timeFormat !== "12h";
      return formatTimeInTimezone(time, timezone, use24Hour);
    } catch (error) {
      console.error("Error formatting time:", error);
      return "Invalid Time";
    }
  }, [timeFormat, timezone]);
  
  const formatDuration = useCallback((durationInSeconds: number) => {
    return formatDurationUtil(durationInSeconds);
  }, []);
  
  const isLoading = dateFormatLoading || timeFormatLoading || timezoneLoading;
  
  return { formatDate, formatTime, formatDuration, isLoading };
}