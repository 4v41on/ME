"use client";

import { useState } from "react";
import { useMemories } from "@/app/hooks/useMemories";
import { type Memory } from "@/app/lib/api";

const CATEGORY_COLORS: Record<string, string> = {
  tarea: "text-[#00D4FF]",
  nota: "text-white",
  recordatorio: "text-[#D4AF37]",
  estado_animo: "text-[#6C63FF]",
  reflexion: "text-[#8888A0]",
  logro: "text-[#D4AF37]",
  aprendizaje: "text-[#00D4FF]",
  pregunta: "text-[#6C63FF]",
  perfil: "text-[#8888A0]",
};

interface Props {
  category?: string;
  showSearch?: boolean;
}

/**
 * MemoryList — displays memories with optional category filter and search.
 */
export function MemoryList({ category, showSearch = true }: Props) {
  const { memories, loading, remove, search } = useMemories(category);
  const [searchResults, setSearchResults] = useState<Memory[] | null>(null);
  const [query, setQuery] = useState("");

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (!q.trim()) {
      setSearchResults(null);
      return;
    }
    const results = await search(q);
    setSearchResults(results);
  };

  const displayed = searchResults ?? memories;

  return (
    <div className="flex flex-col gap-3">
      {showSearch && (
        <input
          type="text"
          placeholder="Buscar memorias..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="bg-[#0D0D14] border border-white/10 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-[#6C63FF] placeholder:text-[#8888A0]"
        />
      )}

      {loading && !displayed.length && (
        <div className="text-[#8888A0] text-sm font-mono">Cargando...</div>
      )}

      {!loading && !displayed.length && (
        <div className="text-[#8888A0] text-sm font-mono">Sin memorias.</div>
      )}

      <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
        {displayed.map((m) => (
          <MemoryCard key={m.id} memory={m} onDelete={() => remove(m.id)} />
        ))}
      </div>
    </div>
  );
}

function MemoryCard({ memory: m, onDelete }: { memory: Memory; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const colorClass = CATEGORY_COLORS[m.category] ?? "text-white";

  return (
    <div className="bg-[#0D0D14] border border-white/5 rounded-lg p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <span className={`font-mono text-xs uppercase ${colorClass}`}>{m.category}</span>
          {m.title && <span className="text-white text-sm font-medium truncate">{m.title}</span>}
          <p
            className={`text-[#8888A0] text-sm ${!expanded ? "line-clamp-2" : ""}`}
            onClick={() => setExpanded(!expanded)}
          >
            {m.content}
          </p>
        </div>
        <button
          onClick={onDelete}
          className="text-[#8888A0] hover:text-red-400 text-xs font-mono shrink-0 transition-colors"
        >
          ✕
        </button>
      </div>
      <span className="text-[#8888A0] text-xs font-mono">
        {new Date(m.created_at).toLocaleDateString("es", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    </div>
  );
}
