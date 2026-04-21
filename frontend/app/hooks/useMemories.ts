"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getMemories,
  createMemory,
  updateMemory,
  deleteMemory,
  searchMemories,
  type Memory,
} from "@/app/lib/api";

export function useMemories(category?: string) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMemories({ category, limit: 50 });
      setMemories(data.memories);
      setTotal(data.total);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    load();
  }, [load]);

  const create = useCallback(
    async (data: { category: string; title?: string; content: string; metadata?: string }) => {
      const m = await createMemory(data);
      setMemories((prev) => [m, ...prev]);
      setTotal((t) => t + 1);
      return m;
    },
    []
  );

  const update = useCallback(async (id: string, data: Partial<Memory>) => {
    await updateMemory(id, data);
    setMemories((prev) => prev.map((m) => (m.id === id ? { ...m, ...data } : m)));
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteMemory(id);
    setMemories((prev) => prev.filter((m) => m.id !== id));
    setTotal((t) => t - 1);
  }, []);

  const search = useCallback(async (q: string): Promise<Memory[]> => {
    return searchMemories(q);
  }, []);

  return { memories, total, loading, error, create, update, remove, search, reload: load };
}
