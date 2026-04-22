"use client";

import { createContext, useContext, useRef, useState, useCallback, type MutableRefObject, type ReactNode } from "react";
import type { AudioData } from "@/app/components/sphere/AudioEngine";

export type SphereState =
  | "dormant"
  | "awakening"
  | "listening"
  | "thinking"
  | "remembering"
  | "growing"
  | "born"
  | "alive"
  | "memory_saved";

export interface SphereParams {
  targetScale: number;
  targetAmplitude: number;
  targetSpeed: number;
  colorBias: number;
}

const STATE_PARAMS: Record<SphereState, SphereParams> = {
  dormant:      { targetScale: 0.6,  targetAmplitude: 0.0,  targetSpeed: 0.2,  colorBias: 0.0  },
  awakening:    { targetScale: 1.0,  targetAmplitude: 0.1,  targetSpeed: 0.4,  colorBias: 0.1  },
  listening:    { targetScale: 1.0,  targetAmplitude: 0.15, targetSpeed: 0.5,  colorBias: 0.4  },
  thinking:     { targetScale: 1.0,  targetAmplitude: 0.6,  targetSpeed: 1.2,  colorBias: 0.2  },
  remembering:  { targetScale: 0.95, targetAmplitude: 0.3,  targetSpeed: 0.3,  colorBias: 0.8  },
  growing:      { targetScale: 1.0,  targetAmplitude: 0.4,  targetSpeed: 0.8,  colorBias: 0.5  },
  born:         { targetScale: 1.5,  targetAmplitude: 1.0,  targetSpeed: 2.0,  colorBias: 1.0  },
  alive:        { targetScale: 1.0,  targetAmplitude: 0.25, targetSpeed: 0.45, colorBias: 0.25 },
  memory_saved: { targetScale: 1.1,  targetAmplitude: 0.5,  targetSpeed: 1.0,  colorBias: 0.9  },
};

const SILENT_AUDIO: AudioData = { amplitude: 0, frequency: 0, raw: new Uint8Array(0) as Uint8Array<ArrayBuffer> };

interface SphereContextValue {
  state: SphereState;
  params: SphereParams;
  growthLevel: number;
  sphereVisible: boolean;
  // audioRef — fuente única de verdad para datos de audio
  // MusicPlayer escribe aquí; EvaSphere lee desde useFrame
  audioRef: MutableRefObject<AudioData>;
  setSphereState: (state: SphereState, durationMs?: number) => void;
  setSphereVisible: (v: boolean) => void;
  incrementGrowth: () => void;
}

const SphereContext = createContext<SphereContextValue | null>(null);

export function SphereProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SphereState>("dormant");
  const [growthLevel, setGrowthLevel] = useState(0);
  const [sphereVisible, setSphereVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // audioRef compartido — único, no recrea entre renders
  const audioRef = useRef<AudioData>(SILENT_AUDIO);

  const params: SphereParams = {
    ...STATE_PARAMS[state],
    targetScale: STATE_PARAMS[state].targetScale + growthLevel * 0.04,
  };

  const setSphereState = useCallback((next: SphereState, durationMs?: number) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setState(next);
    if (durationMs) {
      timeoutRef.current = setTimeout(() => {
        setState((cur) => cur === next ? (growthLevel > 0 ? "alive" : "awakening") : cur);
      }, durationMs);
    }
  }, [growthLevel]);

  const incrementGrowth = useCallback(() => {
    setGrowthLevel((l) => Math.min(l + 1, 13));
    setSphereState("growing", 800);
  }, [setSphereState]);

  return (
    <SphereContext.Provider value={{
      state, params, growthLevel, sphereVisible, audioRef,
      setSphereState, setSphereVisible, incrementGrowth,
    }}>
      {children}
    </SphereContext.Provider>
  );
}

export function useSphere() {
  const ctx = useContext(SphereContext);
  if (!ctx) throw new Error("useSphere must be used inside SphereProvider");
  return ctx;
}

export { STATE_PARAMS };
