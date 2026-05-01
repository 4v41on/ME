"use client";

import { useEffect, useState, useCallback } from "react";
import { getProfile, saveProfile, type ProfileEntry } from "@/app/lib/api";

const FIELD_META: Record<string, { label: string; section: string; readOnly?: boolean }> = {
  ai_name:        { label: "Nombre del agente", section: "Agente", readOnly: true },
  archetype:      { label: "Arquetipo",          section: "Agente", readOnly: true },
  work:           { label: "Trabajo / proyecto / rol",     section: "Qué construyes" },
  purpose:        { label: "Por qué importa",              section: "Qué construyes" },
  goal_90d:       { label: "Meta en 90 días",              section: "A dónde vas" },
  friction:       { label: "Fricción recurrente",          section: "A dónde vas" },
  cognitive_style:{ label: "Modo de decisión",             section: "Cómo piensas" },
  flow_context:   { label: "Contexto de flow",             section: "Cómo piensas" },
  superpower:     { label: "Superpoder",                   section: "Quién eres" },
  blind_spot:     { label: "Punto ciego",                  section: "Quién eres" },
  growth_edge:    { label: "Crecimiento ahora",            section: "Quién eres" },
  agent_role:     { label: "Rol del agente",               section: "Cómo trabajamos" },
  feedback_style: { label: "Estilo de feedback",           section: "Cómo trabajamos" },
  memory_core:    { label: "Ancla de memoria permanente",  section: "Cómo trabajamos" },
  limits:         { label: "Zonas prohibidas",             section: "Cómo trabajamos" },
};

const SECTION_ORDER = ["Agente", "Qué construyes", "A dónde vas", "Cómo piensas", "Quién eres", "Cómo trabajamos"];

function ProfileField({
  entry,
  meta,
  onSave,
}: {
  entry: ProfileEntry;
  meta: { label: string; readOnly?: boolean };
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

  const accent = saved ? "#a855f7" : "#27272a";

  return (
    <div
      className="flex flex-col gap-1 py-2 transition-all"
      style={{ borderLeft: `2px solid ${accent}`, paddingLeft: "10px", transition: "border-color 0.4s ease" }}
    >
      <span className="font-mono uppercase tracking-widest" style={{ fontSize: "8px", color: "#3f3f46" }}>
        {meta.label}
      </span>

      {meta.readOnly ? (
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
          onClick={() => !meta.readOnly && setEditing(true)}
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

  // Agrupar por sección
  const bySection: Record<string, ProfileEntry[]> = {};
  entries.forEach((e) => {
    const meta = FIELD_META[e.key];
    if (!meta) return;
    if (!bySection[meta.section]) bySection[meta.section] = [];
    bySection[meta.section].push(e);
  });

  // Asegurar que campos sin datos del perfil aparezcan igual
  Object.entries(FIELD_META).forEach(([key, meta]) => {
    if (!entries.find((e) => e.key === key)) {
      if (!bySection[meta.section]) bySection[meta.section] = [];
      if (!bySection[meta.section].find((e) => e.key === key)) {
        bySection[meta.section].push({ key, value: "" });
      }
    }
  });

  return (
    <div className="flex flex-col gap-5">
      <p className="font-mono text-[#2a2a35] leading-relaxed" style={{ fontSize: "9px" }}>
        click en cualquier campo para editar · se guarda al perder el foco
      </p>

      {SECTION_ORDER.map((section) => {
        const fields = bySection[section];
        if (!fields?.length) return null;
        return (
          <div key={section} className="flex flex-col gap-1">
            <span
              className="font-mono uppercase tracking-widest mb-2"
              style={{ fontSize: "8px", color: "#3f3f46", borderBottom: "1px solid #18181b", paddingBottom: "4px" }}
            >
              {section}
            </span>
            <div className="flex flex-col gap-3">
              {fields.map((e) => {
                const meta = FIELD_META[e.key];
                if (!meta) return null;
                return (
                  <ProfileField key={e.key} entry={e} meta={meta} onSave={handleSave} />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
