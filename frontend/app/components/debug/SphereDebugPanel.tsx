"use client";

import { useEffect, useRef, useState } from "react";
import { useSphereDebug, DEBUG_DEFAULTS, type DebugParams } from "@/app/context/SphereDebugContext";
import { useSphere } from "@/app/context/SphereContext";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  decimals?: number;
}

interface ToggleProps {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function Slider({ label, value, min, max, step, onChange, decimals = 2 }: SliderProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[9px] text-[#3f3f46] w-24 shrink-0 truncate">{label}</span>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 h-px appearance-none"
        style={{ accentColor: "#a855f7", cursor: "ew-resize" }}
      />
      <span className="font-mono text-[9px] text-[#71717a] w-8 text-right shrink-0">
        {value.toFixed(decimals)}
      </span>
    </div>
  );
}

function Toggle({ label, value, onChange }: ToggleProps) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="flex items-center gap-2 group"
    >
      <span
        className="w-3 h-3 flex items-center justify-center shrink-0 transition-colors"
        style={{
          border: `1px solid ${value ? "#a855f7" : "#27272a"}`,
          background: value ? "rgba(168,85,247,0.2)" : "transparent",
        }}
      >
        {value && <span className="w-1 h-1 rounded-full bg-[#a855f7]" />}
      </span>
      <span className="font-mono text-[9px] text-[#52525b] group-hover:text-[#71717a] transition-colors">
        {label}
      </span>
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="flex flex-col gap-1.5">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between group"
      >
        <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#3f3f46] group-hover:text-[#52525b] transition-colors">
          {title}
        </span>
        <span className="font-mono text-[8px] text-[#27272a]">{open ? "▾" : "▸"}</span>
      </button>
      {open && <div className="flex flex-col gap-1.5 pl-1">{children}</div>}
    </div>
  );
}

// ── Panel principal ───────────────────────────────────────────────────────────

interface SphereDebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SphereDebugPanel({ isOpen, onClose }: SphereDebugPanelProps) {
  const { params, setParam, resetParams, randomizeParams, presetA, presetB, savePreset, loadPreset, exportJSON, fpsRef } = useSphereDebug();
  const { quality, setQuality } = useSphere();

  // FPS display — leer del ref cada segundo sin re-render continuo
  const [fpsDisplay, setFpsDisplay] = useState(0);
  useEffect(() => {
    if (!isOpen) return;
    const id = setInterval(() => setFpsDisplay(fpsRef.current), 1000);
    return () => clearInterval(id);
  }, [isOpen, fpsRef]);

  // Copiar feedback — flash breve
  const [copied, setCopied] = useState(false);
  const handleExport = () => {
    exportJSON();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Animación entrada/salida
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);
  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimating(true)));
    } else {
      setAnimating(false);
      const t = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!visible) return null;

  // Triángulos estimados para el contador
  const tris = params.subdivisions * params.subdivisions * 20;

  const p = params;
  const sp = <K extends keyof DebugParams>(k: K) => (v: DebugParams[K]) => setParam(k, v);

  return (
    <div
      className="fixed left-6 top-1/2 z-50 flex flex-col transition-all duration-300"
      style={{
        transform: animating
          ? "translateY(-50%) translateX(0)"
          : "translateY(-50%) translateX(-120%)",
        transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
        width: "220px",
      }}
    >
      <div
        className="flex flex-col gap-0"
        style={{
          background: "rgba(0,0,0,0.92)",
          border: "1px solid #27272a",
          borderLeft: "2px solid #a855f7",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: "1px solid #1a1a1a" }}>
          <div className="flex items-center gap-2">
            <span className="text-[#a855f7] text-[10px]">◈</span>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#52525b]">sphere debug</span>
          </div>
          <button
            onClick={onClose}
            className="font-mono text-[#27272a] hover:text-[#a855f7] transition-colors text-sm leading-none"
          >
            ×
          </button>
        </div>

        {/* Stats bar */}
        <div className="flex items-center justify-between px-3 py-1.5" style={{ borderBottom: "1px solid #1a1a1a", background: "rgba(255,255,255,0.02)" }}>
          <div className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: fpsDisplay >= 50 ? "#22c55e" : fpsDisplay >= 30 ? "#d97706" : "#ef4444" }}
            />
            <span className="font-mono text-[9px] text-[#52525b]">
              <span style={{ color: fpsDisplay >= 50 ? "#22c55e" : fpsDisplay >= 30 ? "#d97706" : "#ef4444" }}>
                {fpsDisplay}
              </span>
              {" fps"}
            </span>
          </div>
          <span className="font-mono text-[9px] text-[#27272a]">{(tris / 1000).toFixed(0)}k tris</span>

          {/* Quality toggle inline */}
          <button
            onClick={() => setQuality(quality === "lite" ? "high" : "lite")}
            className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 transition-colors"
            style={{
              border: quality === "lite" ? "1px solid rgba(0,212,255,0.5)" : "1px solid #27272a",
              color: quality === "lite" ? "#00d4ff" : "#3f3f46",
            }}
          >
            {quality}
          </button>
        </div>

        {/* A/B Presets */}
        <div className="flex items-center gap-1 px-3 py-2" style={{ borderBottom: "1px solid #1a1a1a" }}>
          <span className="font-mono text-[8px] uppercase tracking-widest text-[#27272a] mr-1">preset</span>
          {(["A", "B"] as const).map((slot) => {
            const hasPreset = slot === "A" ? !!presetA : !!presetB;
            return (
              <div key={slot} className="flex gap-0.5">
                <button
                  onClick={() => savePreset(slot)}
                  title={`Guardar como ${slot}`}
                  className="font-mono text-[8px] px-1.5 py-0.5 transition-colors text-[#3f3f46] hover:text-[#a855f7]"
                  style={{ border: "1px solid #1a1a1a" }}
                >
                  {slot}↓
                </button>
                <button
                  onClick={() => loadPreset(slot)}
                  disabled={!hasPreset}
                  title={hasPreset ? `Cargar ${slot}` : `${slot} vacío`}
                  className="font-mono text-[8px] px-1.5 py-0.5 transition-colors"
                  style={{
                    border: "1px solid #1a1a1a",
                    color: hasPreset ? "#a855f7" : "#1a1a1a",
                    cursor: hasPreset ? "pointer" : "not-allowed",
                  }}
                >
                  {slot}↑
                </button>
              </div>
            );
          })}
        </div>

        {/* Sliders — todas las secciones */}
        <div className="flex flex-col gap-3 px-3 py-3 overflow-y-auto" style={{ maxHeight: "calc(100vh - 260px)" }}>

          <Section title="Geometría">
            <Slider label="subdivisiones" value={p.subdivisions} min={10} max={120} step={1} decimals={0} onChange={(v) => setParam("subdivisions", Math.round(v))} />
            <Toggle label="wireframe" value={p.wireframe} onChange={sp("wireframe")} />
          </Section>

          <div style={{ height: "1px", background: "#1a1a1a" }} />

          <Section title="Deformación">
            <Slider label="amplitud base"  value={p.noiseAmplitude} min={0.05} max={0.8}  step={0.01} onChange={sp("noiseAmplitude")} />
            <Slider label="amplitud micro" value={p.microAmplitude} min={0.0}  max={0.15} step={0.005} onChange={sp("microAmplitude")} />
          </Section>

          <div style={{ height: "1px", background: "#1a1a1a" }} />

          <Section title="Superficie">
            <Slider label="fresnel power"   value={p.fresnelPower}  min={1.0} max={8.0}  step={0.1}  onChange={sp("fresnelPower")} />
            <Slider label="glow base"       value={p.glowBase}      min={0.0} max={6.0}  step={0.1}  onChange={sp("glowBase")} />
            <Slider label="glow × audio"    value={p.glowAudio}     min={0.0} max={10.0} step={0.1}  onChange={sp("glowAudio")} />
            <Slider label="spec power"      value={p.specPower}     min={1}   max={30}   step={1}    decimals={0} onChange={(v) => setParam("specPower", Math.round(v))} />
            <Slider label="spec intensidad" value={p.specIntensity} min={0.0} max={3.0}  step={0.05} onChange={sp("specIntensity")} />
            <Slider label="whitening"       value={p.whitening}     min={0.0} max={1.0}  step={0.01} onChange={sp("whitening")} />
            <Slider label="chroma ab"       value={p.chromaAb}      min={0.0} max={0.25} step={0.005} onChange={sp("chromaAb")} />
          </Section>

          <div style={{ height: "1px", background: "#1a1a1a" }} />

          <Section title="Canvas">
            <Slider label="exposure" value={p.exposure} min={0.3} max={3.0} step={0.05} onChange={sp("exposure")} />
            <Toggle label="ACES tone mapping" value={p.acesToneMapping} onChange={sp("acesToneMapping")} />
          </Section>

        </div>

        {/* Footer — acciones */}
        <div
          className="flex items-center justify-between px-3 py-2 gap-1"
          style={{ borderTop: "1px solid #1a1a1a" }}
        >
          <button
            onClick={randomizeParams}
            className="font-mono text-[8px] uppercase tracking-widest px-2 py-1 transition-colors text-[#52525b] hover:text-[#a855f7]"
            style={{ border: "1px solid #1a1a1a" }}
            title="Valores aleatorios dentro de rangos estéticos"
          >
            rnd
          </button>
          <button
            onClick={resetParams}
            className="font-mono text-[8px] uppercase tracking-widest px-2 py-1 transition-colors text-[#52525b] hover:text-[#71717a]"
            style={{ border: "1px solid #1a1a1a" }}
          >
            reset
          </button>
          <button
            onClick={handleExport}
            className="font-mono text-[8px] uppercase tracking-widest px-2 py-1 transition-colors"
            style={{
              border: copied ? "1px solid rgba(34,197,94,0.4)" : "1px solid #1a1a1a",
              color: copied ? "#22c55e" : "#52525b",
            }}
            title="Copiar JSON al portapapeles"
          >
            {copied ? "✓ json" : "export"}
          </button>
        </div>
      </div>

      {/* Hint teclado */}
      <span className="font-mono text-[8px] text-[#1a1a1a] mt-1 ml-1">D — toggle</span>
    </div>
  );
}
