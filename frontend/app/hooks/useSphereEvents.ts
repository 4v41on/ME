"use client";

import { useEffect } from "react";
import { useSphere, type SphereState } from "@/app/context/SphereContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8082";

type EventType =
  | "connected"
  | "memory_saved"
  | "memory_deleted"
  | "searched"
  | "phase2_complete"
  | "onboarding_complete"
  | "vault_updated";

interface SphereEvent {
  type: EventType;
  payload?: Record<string, unknown>;
}

const EVENT_TO_STATE: Partial<Record<EventType, { state: SphereState; duration?: number }>> = {
  memory_saved:        { state: "memory_saved",  duration: 1000 },
  memory_deleted:      { state: "thinking",      duration: 600  },
  searched:            { state: "remembering",   duration: 1200 },
  phase2_complete:     { state: "born",          duration: 2500 },
  onboarding_complete: { state: "alive"                         },
  vault_updated:       { state: "remembering",   duration: 800  },
};

/**
 * useSphereEvents — suscribe al stream SSE del backend
 * y actualiza el SphereState según los eventos recibidos.
 *
 * Esto hace que la esfera reaccione a interacciones vía MCP,
 * no solo a lo que ocurre en el browser.
 */
export function useSphereEvents() {
  const { setSphereState } = useSphere();

  useEffect(() => {
    let es: EventSource;
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      es = new EventSource(`${API_URL}/api/events`);

      es.onmessage = (e) => {
        try {
          const evt: SphereEvent = JSON.parse(e.data);
          const mapping = EVENT_TO_STATE[evt.type];
          if (mapping) {
            setSphereState(mapping.state, mapping.duration);
          }
        } catch {}
      };

      es.onerror = () => {
        es.close();
        // Reconectar en 5s
        reconnectTimeout = setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      es?.close();
      clearTimeout(reconnectTimeout);
    };
  }, [setSphereState]);
}
