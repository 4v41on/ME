"use client";

import { useEffect, useState, useCallback } from "react";
import { getProfile, saveProfile, type ProfileEntry } from "@/app/lib/api";
import { QUESTIONS } from "@/app/components/onboarding/questions";

// Campos de solo lectura — no vienen de las preguntas del onboarding
const READ_ONLY_FIELDS: Record<string, { label: string; section: string }> = {
  ai_name:   { label: "Nombre del agente", section: "Agente" },
  archetype: { label: "Arquetipo",         section: "Agente" },
};

// Sección para cada bloque de preguntas
const BLOCK_LABEL: Record<string, string> = {
  user_profile: "Perfil",
  interaction:  "Cómo trabajamos",
};

function ProfileField({
  entry,
  label,
  readOnly,
  onSave,
}: {
  entry: ProfileEntry;
  label: string;
  readOnly?: boolean;
  onSave: (key: string, value: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(entry.value);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleBlur = async () => {
    if (value === entry.value) { setEditing(false); return; }
    setSaving(true);
    await onSave(entry.key, value);
    setSaving(false);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };

  const borderColor = saved ? "#a855f7" : "#27272a";

  return (
    <div
      className="flex flex-col gap-1 py-2 transition-all"
      style={{ borderLeft: `2px solid ${borderColor}`, paddingLeft: "10px", transition: "border-color 0.4s ease" }}
    >
      <span className="font-mono uppercase tracking-widest" style={{ fontSize: "8px", color: "#3f3f46" }}>
        {label}
      </span>

      {readOnly ? (
        <span className="font-mono" style={{ fontSize: "11px", color: "#a855f7" }}>
          {entry.value || "—"}
        </span>
      ) : editing ? (
        <textarea
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          disabled={saving}
          rows={3}
          className="font-mono resize-none"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(168,85,247,0.3)",
            borderRadius: 0,
            color: "#a1a1aa",
            fontSize: "11px",
            padding: "6px 8px",
            outline: "none",
            width: "100%",
            opacity: saving ? 0.5 : 1,
          }}
        />
      ) : (
        <span
          className="font-mono cursor-text"
          style={{ fontSize: "11px", color: entry.value ? "#71717a" : "#2a2a35", lineHeight: 1.5 }}
          onClick={() => setEditing(true)}
          title="Click para editar"
        >
          {entry.value || "— click para editar"}
        </span>
      )}
    </div>
  );
}

export function ProfileEditor() {
  const [entries, setEntries] = useState<ProfileEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProfile()
      .then((r) => setEntries(r.entries))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = useCallback(async (key: string, value: string) => {
    await saveProfile([{ key, value }]);
    setEntries((prev) => prev.map((e) => e.key === key ? { ...e, value } : e));
  }, []);

  if (loading) return (
    <span className="font-mono text-[10px] text-[#2a2a35] uppercase tracking-widest animate-pulse">
      cargando perfil...
    </span>
  );

  // Mapa key→entry para lookup rápido
  const entryMap = new Map(entries.map((e) => [e.key, e]));
  const blankEntry = (key: string): ProfileEntry => ({ key, value: "" });

  // Agrupar preguntas por bloque (viene de questions.ts — fuente única de verdad)
  const byBlock = new Map<string, typeof QUESTIONS>();
  QUESTIONS.forEach((q) => {
    if (!byBlock.has(q.block)) byBlock.set(q.block, []);
    byBlock.get(q.block)!.push(q);
  });

  return (
    <div className="flex flex-col gap-5">
      <p className="font-mono text-[#2a2a35] leading-relaxed" style={{ fontSize: "9px" }}>
        click en cualquier campo para editar · se guarda al perder el foco
      </p>

      {/* Campos de solo lectura: ai_name, archetype */}
      <div className="flex flex-col gap-1">
        <span
          className="font-mono uppercase tracking-widest mb-2"
          style={{ fontSize: "8px", color: "#3f3f46", borderBottom: "1px solid #18181b", paddingBottom: "4px" }}
        >
          Agente
        </span>
        <div className="flex flex-col gap-3">
          {Object.entries(READ_ONLY_FIELDS).map(([key, meta]) => (
            <ProfileField
              key={key}
              entry={entryMap.get(key) ?? blankEntry(key)}
              label={meta.label}
              readOnly
              onSave={handleSave}
            />
          ))}
        </div>
      </div>

      {/* Preguntas del onboarding, agrupadas por bloque — desde questions.ts */}
      {Array.from(byBlock.entries()).map(([block, questions]) => (
        <div key={block} className="flex flex-col gap-1">
          <span
            className="font-mono uppercase tracking-widest mb-2"
            style={{ fontSize: "8px", color: "#3f3f46", borderBottom: "1px solid #18181b", paddingBottom: "4px" }}
          >
            {BLOCK_LABEL[block] ?? block}
          </span>
          <div className="flex flex-col gap-3">
            {questions.map((q) => (
              <ProfileField
                key={q.id}
                entry={entryMap.get(q.id) ?? blankEntry(q.id)}
                label={q.blockLabel + " — " + q.text.slice(0, 50) + (q.text.length > 50 ? "…" : "")}
                onSave={handleSave}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
