interface TrackedTimeEntry {
  id: number;
  startTime: Date;
  endTime: Date | null;
  duration: bigint;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FormattedTimeEntry {
  id: number;
  startTime: string;
  endTime: string | undefined;
  duration: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Format a time entry for API response
 * Converts Date objects to ISO strings and BigInt duration to number
 */
export function formatTimeEntryResponse(entry: TrackedTimeEntry): FormattedTimeEntry {
  return {
    ...entry,
    startTime: entry.startTime.toISOString(),
    endTime: entry.endTime?.toISOString(),
    duration: Number(entry.duration),
  };
}
