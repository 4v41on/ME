"use client";

import { useState, useEffect, useCallback } from "react";
import { getDashboard, type DashboardStats } from "@/app/lib/api";

/**
 * useDashboard — fetches dashboard metrics and auto-refreshes every 30 seconds.
 */
export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await getDashboard();
      setStats(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  return { stats, loading, error, reload: load };
}
