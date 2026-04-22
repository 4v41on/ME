"use client";

import { useState } from "react";
import { useMemories } from "@/app/hooks/useMemories";

const CATEGORIES = [
  "nota",
  "tarea",
  "reflexion",
  "aprendizaje",
  "logro",
  "recordatorio",
  "estado_animo",
  "pregunta",
];

interface Props {
  onSaved?: () => void;
}

export function MemoryForm({ onSaved }: Props) {
  const { create } = useMemories();
  const [category, setCategory] = useState("nota");
  const [title, setTitle]     = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    try {
      await create({ category, title, content });
      setTitle("");
      setContent("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onSaved?.();
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  // ─── Ghost input estilo ──────────────────────────────────────────────────────
  const ghostInput = (id: string) => ({
    background: "transparent",
    border: "none",
    borderBottom: `1px solid ${focusedField === id ? "rgba(168,85,247,0.5)" : "rgba(255,255,255,0.08)"}`,
    borderRadius: 0,
    outline: "none",
    transition: "border-color 0.25s ease",
    color: "#d4d4d8",
    fontFamily: "inherit",
    fontSize: "12px",
    width: "100%",
    padding: "6px 0",
  } as React.CSSProperties);

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        paddingBottom: "20px",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-[#a855f7] font-mono text-xs select-none">›</span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-[#3f3f46]">
          nueva memoria
        </span>
      </div>

      {/* Selector de categoría — chips horizontales */}
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((c) => {
          const active = category === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className="font-mono transition-colors"
              style={{
                fontSize: "9px",
                padding: "3px 8px",
                border: `1px solid ${active ? "rgba(168,85,247,0.5)" : "rgba(255,255,255,0.06)"}`,
                color: active ? "#a855f7" : "#3f3f46",
                background: active ? "rgba(168,85,247,0.07)" : "transparent",
                borderRadius: 0,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                transition: "all 0.2s ease",
              }}
            >
              {c}
            </button>
          );
        })}
      </div>

      {/* Título — ghost input */}
      <input
        type="text"
        placeholder="título"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onFocus={() => setFocusedField("title")}
        onBlur={() => setFocusedField(null)}
        className="font-mono placeholder:text-[#2a2a35]"
        style={ghostInput("title")}
      />

      {/* Contenido — ghost textarea */}
      <textarea
        placeholder="contenido..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onFocus={() => setFocusedField("content")}
        onBlur={() => setFocusedField(null)}
        rows={3}
        className="font-mono resize-none placeholder:text-[#2a2a35]"
        style={ghostInput("content")}
      />

      {/* Submit — ghost button con flecha */}
      <button
        type="submit"
        disabled={saving || !content.trim()}
        className="self-start font-mono flex items-center gap-2 group transition-colors"
        style={{
          fontSize: "11px",
          color: saved ? "#a855f7" : saving || !content.trim() ? "#2a2a35" : "#52525b",
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: saving || !content.trim() ? "default" : "pointer",
          transition: "color 0.25s ease",
        }}
        onMouseEnter={(e) => {
          if (!saving && content.trim() && !saved)
            (e.currentTarget as HTMLElement).style.color = "#a855f7";
        }}
        onMouseLeave={(e) => {
          if (!saved)
            (e.currentTarget as HTMLElement).style.color = saving || !content.trim() ? "#2a2a35" : "#52525b";
        }}
      >
        <span
          className="transition-transform group-hover:translate-x-0.5"
          style={{ display: "inline-block" }}
        >
          {saved ? "✓" : "→"}
        </span>
        {saved ? "guardado" : saving ? "guardando..." : "guardar"}
      </button>
    </form>
  );
}
