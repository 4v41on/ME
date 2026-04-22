"use client";

import { useState } from "react";
import { useMemories } from "@/app/hooks/useMemories";
import { type Memory } from "@/app/lib/api";

// Solo #a855f7 y #00d4ff — ambos están en los tokens del sistema
const CATEGORY_ACCENT: Record<string, string> = {
  tarea:        "#a855f7",
  nota:         "#52525b",
  recordatorio: "#00d4ff",
  estado_animo: "#a855f7",
  reflexion:    "#52525b",
  logro:        "#a855f7",
  aprendizaje:  "#00d4ff",
  pregunta:     "#71717a",
  perfil:       "#a855f7",
};

interface Props {
  category?: string;
  showSearch?: boolean;
}

export function MemoryList({ category, showSearch = true }: Props) {
  const { memories, loading, remove, search } = useMemories(category);
  const [searchResults, setSearchResults] = useState<Memory[] | null>(null);
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (!q.trim()) { setSearchResults(null); return; }
    const results = await search(q);
    setSearchResults(results);
  };

  const displayed = searchResults ?? memories;

  return (
    <div className="flex flex-col gap-4">
      {/* Search — solo borde inferior, sin box */}
      {showSearch && (
        <div className="relative">
          <span
            className="absolute left-0 top-1/2 -translate-y-1/2 font-mono text-xs select-none pointer-events-none transition-colors"
            style={{ color: searchFocused ? "#a855f7" : "#2a2a35" }}
          >
            /
          </span>
          <input
            type="text"
            placeholder="buscar..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="font-mono w-full placeholder:text-[#2a2a35]"
            style={{
              background: "transparent",
              border: "none",
              borderBottom: `1px solid ${searchFocused ? "rgba(168,85,247,0.4)" : "rgba(255,255,255,0.06)"}`,
              borderRadius: 0,
              outline: "none",
              color: "#a1a1aa",
              fontSize: "11px",
              padding: "4px 0 4px 14px",
              transition: "border-color 0.25s ease",
            }}
          />
        </div>
      )}

      {/* Estados vacíos */}
      {loading && !displayed.length && (
        <span className="font-mono text-[10px] text-[#2a2a35] uppercase tracking-widest">
          cargando...
        </span>
      )}
      {!loading && !displayed.length && (
        <span className="font-mono text-[10px] text-[#2a2a35] uppercase tracking-widest">
          {query ? "sin resultados" : "sin memorias"}
        </span>
      )}

      {/* Lista */}
      <div className="flex flex-col gap-1.5 max-h-[420px] overflow-y-auto pr-0.5">
        {displayed.map((m, i) => (
          <MemoryCard
            key={m.id}
            memory={m}
            onDelete={() => remove(m.id)}
            delay={i * 30}
          />
        ))}
      </div>
    </div>
  );
}

function MemoryCard({
  memory: m,
  onDelete,
  delay,
}: {
  memory: Memory;
  onDelete: () => void;
  delay: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const accent = CATEGORY_ACCENT[m.category] ?? "#52525b";

  return (
    <div
      className="relative flex flex-col gap-2 px-3 py-3 animate-fade-in-up"
      style={{
        background: hovered ? "rgba(255,255,255,0.02)" : "transparent",
        border: "1px solid transparent",
        borderLeft: `2px solid ${hovered ? accent : accent + "40"}`,
        animationDelay: `${delay}ms`,
        transition: "background 0.2s ease, border-color 0.2s ease",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Header: categoría + fecha + delete */}
      <div className="flex items-center justify-between gap-2">
        <span
          className="font-mono uppercase tracking-widest"
          style={{ fontSize: "9px", color: accent + "bb" }}
        >
          {m.category}
        </span>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[#2a2a35]" style={{ fontSize: "9px" }}>
            {new Date(m.created_at).toLocaleDateString("es", {
              day: "2-digit",
              month: "short",
            })}
          </span>
          <button
            onClick={onDelete}
            className="font-mono transition-colors"
            style={{
              fontSize: "9px",
              color: hovered ? "#71717a" : "#2a2a35",
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "pointer",
            }}
            aria-label="Eliminar"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Título */}
      {m.title && (
        <span className="font-mono text-[#a1a1aa]" style={{ fontSize: "11px" }}>
          {m.title}
        </span>
      )}

      {/* Contenido */}
      <p
        className={`font-mono text-[#52525b] leading-relaxed ${!expanded ? "line-clamp-2" : ""}`}
        style={{ fontSize: "11px", cursor: "pointer" }}
        onClick={() => setExpanded(!expanded)}
      >
        {m.content}
      </p>

      {/* Expand hint */}
      {!expanded && m.content.length > 120 && (
        <button
          onClick={() => setExpanded(true)}
          className="self-start font-mono transition-colors"
          style={{
            fontSize: "9px",
            color: "#3f3f46",
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: "pointer",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#71717a")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#3f3f46")}
        >
          › ver más
        </button>
      )}
    </div>
  );
}
