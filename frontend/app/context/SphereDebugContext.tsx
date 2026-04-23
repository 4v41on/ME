"use client";

import {
  createContext, useContext, useState, useRef,
  useCallback, type MutableRefObject, type ReactNode,
} from "react";

export interface DebugParams {
  // Geometría
  subdivisions: number;
  wireframe: boolean;
  // Vertex — deformación
  noiseAmplitude: number;
  microAmplitude: number;
  // Fragment — superficie
  fresnelPower: number;
  glowBase: number;
  glowAudio: number;
  specPower: number;
  specIntensity: number;
  whitening: number;
  chromaAb: number;
  // Canvas
  acesToneMapping: boolean;
  exposure: number;
}

export const DEBUG_DEFAULTS: DebugParams = {
  subdivisions:   80,
  wireframe:      false,
  noiseAmplitude: 0.35,
  microAmplitude: 0.04,
  fresnelPower:   3.0,
  glowBase:       2.8,
  glowAudio:      4.0,
  specPower:      6.0,
  specIntensity:  1.5,
  whitening:      0.4,
  chromaAb:       0.0,
  acesToneMapping: false,
  exposure:       1.0,
};

// Rangos para el botón Randomize — estéticamente seguros
const RANDOMIZE_RANGES: Record<keyof DebugParams, [number, number] | boolean> = {
  subdivisions:   [20, 80],
  wireframe:      false,
  noiseAmplitude: [0.15, 0.55],
  microAmplitude: [0.0, 0.08],
  fresnelPower:   [1.5, 5.0],
  glowBase:       [0.5, 4.0],
  glowAudio:      [1.0, 6.0],
  specPower:      [3, 15],
  specIntensity:  [0.3, 2.0],
  whitening:      [0.1, 0.6],
  chromaAb:       [0.0, 0.15],
  acesToneMapping: false,
  exposure:       [0.7, 1.5],
};

function randomInRange(min: number, max: number) {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

interface SphereDebugContextValue {
  params: DebugParams;
  setParam: <K extends keyof DebugParams>(key: K, value: DebugParams[K]) => void;
  resetParams: () => void;
  randomizeParams: () => void;
  presetA: DebugParams | null;
  presetB: DebugParams | null;
  savePreset: (slot: "A" | "B") => void;
  loadPreset: (slot: "A" | "B") => void;
  exportJSON: () => void;
  // FPS medido desde EvaSphere.useFrame — ref compartido sin re-renders
  fpsRef: MutableRefObject<number>;
}

const SphereDebugContext = createContext<SphereDebugContextValue | null>(null);

export function SphereDebugProvider({ children }: { children: ReactNode }) {
  const [params, setParams] = useState<DebugParams>(DEBUG_DEFAULTS);
  const [presetA, setPresetA] = useState<DebugParams | null>(null);
  const [presetB, setPresetB] = useState<DebugParams | null>(null);
  const fpsRef = useRef(0);

  const setParam = useCallback(<K extends keyof DebugParams>(key: K, value: DebugParams[K]) => {
    setParams(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetParams = useCallback(() => setParams(DEBUG_DEFAULTS), []);

  const randomizeParams = useCallback(() => {
    const next = { ...params };
    for (const key of Object.keys(RANDOMIZE_RANGES) as (keyof DebugParams)[]) {
      const range = RANDOMIZE_RANGES[key];
      if (Array.isArray(range)) {
        (next as Record<string, unknown>)[key] = randomInRange(range[0], range[1]);
      }
    }
    // Subdivisions son enteras
    next.subdivisions = Math.round(next.subdivisions);
    next.specPower    = Math.round(next.specPower);
    setParams(next);
  }, [params]);

  const savePreset = useCallback((slot: "A" | "B") => {
    if (slot === "A") setPresetA({ ...params });
    else              setPresetB({ ...params });
  }, [params]);

  const loadPreset = useCallback((slot: "A" | "B") => {
    const preset = slot === "A" ? presetA : presetB;
    if (preset) setParams({ ...preset });
  }, [presetA, presetB]);

  const exportJSON = useCallback(() => {
    const json = JSON.stringify(params, null, 2);
    navigator.clipboard.writeText(json).catch(() => {});
  }, [params]);

  return (
    <SphereDebugContext.Provider value={{
      params, setParam, resetParams, randomizeParams,
      presetA, presetB, savePreset, loadPreset,
      exportJSON, fpsRef,
    }}>
      {children}
    </SphereDebugContext.Provider>
  );
}

export function useSphereDebug() {
  const ctx = useContext(SphereDebugContext);
  if (!ctx) throw new Error("useSphereDebug must be inside SphereDebugProvider");
  return ctx;
}
