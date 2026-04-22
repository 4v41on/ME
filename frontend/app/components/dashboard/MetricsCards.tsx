"use client";

import { useEffect, useRef, useState } from "react";
import { useDashboard } from "@/app/hooks/useDashboard";

// ─── Contador animado (0 → value, ease-out cubic) ─────────────────────────────
function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const duration = 900;
    const startTime = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(Math.round(value * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);

  return <>{display}</>;
}

// ─── Card individual ──────────────────────────────────────────────────────────
function MetricCard({
  label,
  value,
  accent,
  symbol,
  delay,
}: {
  label: string;
  value: number;
  accent: string;
  symbol: string;
  delay: number;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative flex flex-col justify-between p-4 overflow-hidden animate-fade-in-up"
      style={{
        background: "rgba(0,0,0,0.6)",
        border: `1px solid ${hovered ? accent + "28" : "rgba(255,255,255,0.05)"}`,
        borderLeft: `2px solid ${hovered ? accent : accent + "55"}`,
        animationDelay: `${delay}ms`,
        transition: "border-color 0.35s ease",
        minHeight: "88px",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Glow sweep en top border */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "1px",
          background: `linear-gradient(90deg, ${accent}70, transparent 70%)`,
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.35s ease",
        }}
      />

      {/* Símbolo decorativo top-right */}
      <span
        className="absolute top-3 right-3 font-mono text-base select-none pointer-events-none"
        style={{
          color: accent + (hovered ? "40" : "20"),
          transition: "color 0.35s ease",
          lineHeight: 1,
        }}
      >
        {symbol}
      </span>

      {/* Valor + etiqueta */}
      <div className="flex flex-col gap-1 mt-auto pt-3">
        <span
          className="font-mono font-bold leading-none"
          style={{
            fontSize: "clamp(1.5rem, 4vw, 2rem)",
            color: hovered ? accent : accent + "cc",
            transition: "color 0.35s ease",
          }}
        >
          <AnimatedNumber value={value} />
        </span>
        <span
          className="font-mono uppercase tracking-widest"
          style={{ fontSize: "9px", color: "#3f3f46" }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

// ─── Grid de métricas ─────────────────────────────────────────────────────────
export function MetricsCards() {
  const { stats, loading } = useDashboard();

  if (loading && !stats) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse"
            style={{
              height: "88px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.04)",
            }}
          />
        ))}
      </div>
    );
  }

  const cards = [
    { label: "memorias",    value: stats?.total_memories ?? 0,                               accent: "#a855f7", symbol: "𒊮" },
    { label: "pendientes",  value: stats?.tareas_pendientes ?? 0,                            accent: "#00d4ff", symbol: "◈" },
    { label: "hoy",         value: stats?.tareas_hoy ?? 0,                                  accent: "#a855f7", symbol: "›" },
    { label: "categorías",  value: Object.keys(stats?.por_categoria ?? {}).length,           accent: "#52525b", symbol: "⊹" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((c, i) => (
        <MetricCard key={c.label} {...c} delay={i * 70} />
      ))}
    </div>
  );
}
