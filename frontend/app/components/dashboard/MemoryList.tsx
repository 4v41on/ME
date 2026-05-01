"use client";

import { useState } from "react";
import { useMemories } from "@/app/hooks/useMemories";
import { type Memory } from "@/app/lib/api";

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

const ALL_CATEGORIES = Object.keys(CATEGORY_ACCENT);

interface Props {
  category?: string;
  showSearch?: boolean;
}

export function MemoryList({ category, showSearch = true }: Props) {
  const { memories, loading, remove, update, search } = useMemories(category);
  const [searchResults, setSearchResults] = useState<Memory[] | null>(null);
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("todos");

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (!q.trim()) { setSearchResults(null); return; }
    const results = await search(q);
    setSearchResults(results);
  };

  // Categorías que tienen al menos una memoria
  const availableCategories = ALL_CATEGORIES.filter(
    (cat) => memories.some((m) => m.category === cat)
  );

  // Aplicar filtro de categoría sobre resultados de búsqueda o lista completa
  const base = searchResults ?? memories;
  const displayed = activeFilter === "todos" ? base : base.filter((m) => m.category === activeFilter);

  return (
    <div className="flex flex-col gap-3">
      {/* Search */}
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

      {/* Filtros por categoría */}
      {availableCategories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <FilterChip
            label="todos"
            active={activeFilter === "todos"}
            accent="#52525b"
            onClick={() => setActiveFilter("todos")}
          />
          {availableCategories.map((cat) => (
            <FilterChip
              key={cat}
              label={cat}
              active={activeFilter === cat}
              accent={CATEGORY_ACCENT[cat] ?? "#52525b"}
              onClick={() => setActiveFilter(activeFilter === cat ? "todos" : cat)}
            />
          ))}
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
      <div className="flex flex-col gap-1.5 max-h-[400px] overflow-y-auto pr-0.5">
        {displayed.map((m, i) => (
          <MemoryCard
            key={m.id}
            memory={m}
            onDelete={() => remove(m.id)}
            onUpdate={(data) => update(m.id, data)}
            delay={i * 30}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Chip de filtro ────────────────────────────────────────────────────────────

function FilterChip({ label, active, accent, onClick }: {
  label: string; active: boolean; accent: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="font-mono uppercase tracking-widest transition-all"
      style={{
        fontSize: "8px",
        padding: "2px 7px",
        border: `1px solid ${active ? accent : accent + "30"}`,
        background: active ? accent + "20" : "transparent",
        color: active ? accent : "#3f3f46",
        cursor: "pointer",
        transition: "all 0.2s ease",
      }}
    >
      {label}
    </button>
  );
}

// ─── MemoryCard ───────────────────────────────────────────────────────────────

function MemoryCard({
  memory: m,
  onDelete,
  onUpdate,
  delay,
}: {
  memory: Memory;
  onDelete: () => void;
  onUpdate: (data: Partial<Memory>) => Promise<void>;
  delay: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(m.title);
  const [editContent, setEditContent] = useState(m.content);
  const [saving, setSaving] = useState(false);
  const accent = CATEGORY_ACCENT[m.category] ?? "#52525b";

  const handleSave = async () => {
    setSaving(true);
    await onUpdate({ title: editTitle, content: editContent });
    setSaving(false);
    setEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(m.title);
    setEditContent(m.content);
    setEditing(false);
  };

  return (
    <div
      className="relative flex flex-col gap-2 px-3 py-3 animate-fade-in-up"
      style={{
        background: hovered ? `${accent}08` : `${accent}04`,
        border: "1px solid transparent",
        borderLeft: `2px solid ${hovered ? accent : accent + "60"}`,
        animationDelay: `${delay}ms`,
        transition: "background 0.2s ease, border-color 0.2s ease",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Header: categoría + fecha + acciones */}
      <div className="flex items-center justify-between gap-2">
        {/* Badge de categoría */}
        <span
          className="font-mono uppercase tracking-widest"
          style={{
            fontSize: "8px",
            color: accent,
            background: accent + "18",
            padding: "1px 5px",
          }}
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

          {/* Botón editar — visible en hover */}
          {hovered && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="font-mono transition-colors"
              style={{
                fontSize: "9px",
                color: "#52525b",
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: "pointer",
              }}
              aria-label="Editar"
            >
              ✎
            </button>
          )}

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

      {/* Modo edición */}
      {editing ? (
        <div className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="título (opcional)"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="font-mono"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${accent}30`,
              color: "#a1a1aa",
              fontSize: "11px",
              padding: "4px 8px",
              outline: "none",
              width: "100%",
            }}
          />
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={4}
            className="font-mono resize-none"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${accent}30`,
              color: "#a1a1aa",
              fontSize: "11px",
              padding: "4px 8px",
              outline: "none",
              width: "100%",
            }}
          />
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="font-mono transition-colors"
              style={{
                fontSize: "9px",
                color: accent,
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: "pointer",
                opacity: saving ? 0.5 : 1,
              }}
            >
              {saving ? "guardando..." : "guardar →"}
            </button>
            <button
              onClick={handleCancelEdit}
              className="font-mono transition-colors"
              style={{
                fontSize: "9px",
                color: "#3f3f46",
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: "pointer",
              }}
            >
              cancelar
            </button>
          </div>
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
