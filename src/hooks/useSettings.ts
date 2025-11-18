"use client";

import { useState, useEffect } from "react";

export function useSetting<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSetting = async () => {
      try {
        const response = await fetch(`/api/settings?key=${key}`);
        const data = await response.json();
        setValue(data.value ?? defaultValue);
      } catch (error) {
        console.error(`Failed to get setting ${key}:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchSetting();
  }, [key, defaultValue]);

  return { value, loading };
}