"use client";

import { useDashboard } from "@/app/hooks/useDashboard";

/**
 * MetricsCards — 4 cards showing key system metrics.
 * Auto-refreshes every 30 seconds via useDashboard.
 */
export function MetricsCards() {
  const { stats, loading } = useDashboard();

  if (loading && !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-[#0D0D14] border border-white/5 rounded-lg p-5 animate-pulse h-24" />
        ))}
      </div>
    );
  }

  const cards = [
    { label: "Total memorias", value: stats?.total_memories ?? 0, color: "text-[#00D4FF]" },
    { label: "Tareas pendientes", value: stats?.tareas_pendientes ?? 0, color: "text-[#6C63FF]" },
    { label: "Tareas hoy", value: stats?.tareas_hoy ?? 0, color: "text-[#D4AF37]" },
    {
      label: "Categorías activas",
      value: Object.keys(stats?.por_categoria ?? {}).length,
      color: "text-white",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="bg-[#0D0D14] border border-white/5 rounded-lg p-5 flex flex-col gap-1"
        >
          <span className={`text-3xl font-mono font-bold ${c.color}`}>{c.value}</span>
          <span className="text-[#8888A0] text-sm">{c.label}</span>
        </div>
      ))}
    </div>
  );
}
