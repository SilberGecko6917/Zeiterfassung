"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useSetting } from "@/hooks/useSettings";

export function useFormatting() {
  const { value: dateFormat, loading: dateFormatLoading } = useSetting("date_format", "dd.MM.yyyy");
  const { value: timeFormat, loading: timeFormatLoading } = useSetting("time_format", "24h");
  
  const formatDate = useCallback((date: Date | string | null | undefined) => {
    if (!date) return "";
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      return format(dateObj, dateFormat as string, { locale: de });
    } catch (error) {
      console.error("Error formatting date:", error);
      return new Date(date).toLocaleDateString();
    }
  }, [dateFormat]);
  
  const formatTime = useCallback((time: Date | string | null | undefined) => {
    if (!time) return "";
    try {
      const timeObj = typeof time === "string" ? new Date(time) : time;
      if (timeFormat === "12h") {
        return format(timeObj, "hh:mm a", { locale: de });
      }
      return format(timeObj, "HH:mm", { locale: de });
    } catch (error) {
      console.error("Error formatting time:", error);
      return new Date(time).toLocaleTimeString();
    }
  }, [timeFormat]);
  
  const isLoading = dateFormatLoading || timeFormatLoading;
  
  return { formatDate, formatTime, isLoading };
}