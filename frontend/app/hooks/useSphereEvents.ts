"use client";

import { useEffect } from "react";
import { useSphere, type SphereState } from "@/app/context/SphereContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8082";

// Color de la esfera por categoría de memoria
const CATEGORY_COLORS: Record<string, string> = {
  tarea:        "#a855f7",  // violeta     — acción concreta
  nota:         "#71717a",  // gris        — observación
  reflexion:    "#f472b6",  // rosa        — introspección
  estado_animo: "#22d3ee",  // cian claro  — estado emocional
  logro:        "#fde68a",  // dorado      — celebración
  aprendizaje:  "#00d4ff",  // cian        — conocimiento nuevo
  pregunta:     "#fb923c",  // naranja     — incertidumbre/curiosidad
  perfil:       "#c084fc",  // lila        — identidad
};

type EventType =
  | "connected"
  | "memory_saved"
  | "memory_deleted"
  | "searched"
  | "phase2_complete"
  | "onboarding_complete"
  | "vault_updated"
  | "mcp_active"    // Claude/OpenCode inicia sesión (abrakadabra)
  | "mcp_save"      // Claude guarda una memoria
  | "mcp_search"    // Claude busca en memoria
  | "mcp_vault";    // Claude actualiza el vault CAG

interface SphereEvent {
  type: EventType;
  payload?: Record<string, unknown>;
}

const EVENT_TO_STATE: Partial<Record<EventType, { state: SphereState; duration?: number }>> = {
  // Eventos desde la UI
  memory_saved:        { state: "memory_saved",  duration: 1200 },
  memory_deleted:      { state: "thinking",      duration: 600  },
  searched:            { state: "remembering",   duration: 1200 },
  phase2_complete:     { state: "born",          duration: 2500 },
  onboarding_complete: { state: "alive"                         },
  vault_updated:       { state: "growing",       duration: 900  },
  // Eventos desde Claude/OpenCode vía MCP
  mcp_active:          { state: "awakening",     duration: 2000 },
  mcp_save:            { state: "memory_saved",  duration: 1200 },
  mcp_search:          { state: "remembering",   duration: 1500 },
  mcp_vault:           { state: "growing",       duration: 1200 },
};

export function useSphereEvents() {
  const { setSphereState, setCategoryColor } = useSphere();

  useEffect(() => {
    let es: EventSource;
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      es = new EventSource(`${API_URL}/api/events`);

      es.onmessage = (e) => {
        try {
          const evt: SphereEvent = JSON.parse(e.data);
          const mapping = EVENT_TO_STATE[evt.type];
          if (!mapping) return;

          // Extraer color de categoría para eventos de memoria
          const isMemoryEvent = evt.type === "memory_saved" || evt.type === "mcp_save";
          if (isMemoryEvent && evt.payload?.category) {
            const category = evt.payload.category as string;
            const color = CATEGORY_COLORS[category] ?? null;
            if (color) {
              setCategoryColor(color);
              // Limpiar el color después de que el estado termine
              const clearAfter = (mapping.duration ?? 1000) + 600;
              setTimeout(() => setCategoryColor(null), clearAfter);
            }
          }

          setSphereState(mapping.state, mapping.duration);
        } catch {}
      };

      es.onerror = () => {
        es.close();
        reconnectTimeout = setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      es?.close();
      clearTimeout(reconnectTimeout);
    };
  }, [setSphereState, setCategoryColor]);
}
