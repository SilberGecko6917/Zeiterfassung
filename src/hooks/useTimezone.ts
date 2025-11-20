"use client";

import { useSession } from "next-auth/react";
import { useEffect, useCallback, useState } from "react";

export function useTimezone() {
  const { data: session } = useSession();
  const [timezone, setTimezone] = useState<string>("UTC");
  const [loading, setLoading] = useState(true);

  const fetchTimezone = useCallback(async () => {
    try {
      if (session?.user) {
        // Fetch user timezone from API
        const response = await fetch("/api/user/timezone");
        if (response.ok) {
          const data = await response.json();
          setTimezone(data.timezone || "UTC");
        }
      }
    } catch (error) {
      console.error("Error fetching timezone:", error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchTimezone();
  }, [fetchTimezone]);

  return { timezone, loading };
}
