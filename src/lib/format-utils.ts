import { getSetting } from "@/lib/settings";
import { format as dateFnsFormat } from "date-fns";
import { de } from "date-fns/locale";

export async function formatDate(date: Date | string): Promise<string> {
  const dateFormat = await getSetting<string>("date_format");
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateFnsFormat(dateObj, dateFormat, { locale: de });
}

export async function formatTime(date: Date | string): Promise<string> {
  const timeFormat = await getSetting<string>("time_format");
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  if (timeFormat === "12h") {
    return dateFnsFormat(dateObj, "hh:mm a", { locale: de });
  }
  
  return dateFnsFormat(dateObj, "HH:mm", { locale: de });
}

export function formatDuration(durationInSeconds: number): string {
  const hours = Math.floor(durationInSeconds / 3600);
  const minutes = Math.floor((durationInSeconds % 3600) / 60);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}