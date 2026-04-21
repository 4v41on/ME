"use client";

import { useState } from "react";
import { useMemories } from "@/app/hooks/useMemories";

const CATEGORIES = [
  "tarea",
  "nota",
  "recordatorio",
  "estado_animo",
  "reflexion",
  "logro",
  "aprendizaje",
  "pregunta",
];

interface Props {
  onSaved?: () => void;
}

/**
 * MemoryForm — quick-add form for creating new memories.
 */
export function MemoryForm({ onSaved }: Props) {
  const { create } = useMemories();
  const [category, setCategory] = useState("nota");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
      // silent — the list will show old data
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#0D0D14] border border-white/5 rounded-lg p-5 flex flex-col gap-3">
      <h3 className="text-white font-mono text-sm uppercase tracking-widest">Nueva memoria</h3>

      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="bg-[#050508] border border-white/10 rounded px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-[#6C63FF]"
      >
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <input
        type="text"
        placeholder="Título (opcional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="bg-[#050508] border border-white/10 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-[#6C63FF] placeholder:text-[#8888A0]"
      />

      <textarea
        placeholder="Contenido..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        className="bg-[#050508] border border-white/10 rounded px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-[#6C63FF] placeholder:text-[#8888A0]"
      />

      <button
        type="submit"
        disabled={saving || !content.trim()}
        className="bg-[#6C63FF] hover:bg-[#5a52e0] disabled:opacity-40 text-white text-sm font-mono py-2 px-4 rounded transition-colors"
      >
        {saved ? "✓ Guardado" : saving ? "Guardando..." : "Guardar"}
      </button>
    </form>
  );
}
