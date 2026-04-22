"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { EvaSphere } from "./EvaSphere";
import { AudioEngine } from "./AudioEngine";
import { BinauralEngine, BINAURAL_PRESETS, type BinauralPreset } from "./BinauralEngine";
import { useSphere } from "@/app/context/SphereContext";

type Mode = "binaural" | "file";

/**
 * MusicPlayer — driver de audio + esfera.
 *
 * Escribe en SphereContext.audioRef cada frame.
 * EvaSphere lee desde el mismo ref en useFrame — fuente única de verdad.
 *
 * Binaural: arranca al seleccionar preset. Sin botón ▶ separado.
 * File: arranca al seleccionar track.
 */
export function MusicPlayer() {
  const { sphereVisible, audioRef } = useSphere();

  const [tracks, setTracks] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [mode, setMode] = useState<Mode>("binaural");
  const handleModeChange = (m: Mode) => { setMode(m); modeRef.current = m; };
  const [activePreset, setActivePreset] = useState<BinauralPreset | null>(null);

  const htmlAudioRef = useRef<HTMLAudioElement>(null);
  const fileEngineRef = useRef<AudioEngine>(new AudioEngine());
  const binauralEngineRef = useRef<BinauralEngine>(new BinauralEngine());
  const rafRef = useRef<number>(0);
  const fileConnected = useRef(false);
  const lastProgressUpdate = useRef(0);
  // Indicador de amplitud en vivo — DOM directo, sin re-renders
  const ampDotRef = useRef<HTMLSpanElement>(null);
  // Glow ambiente detrás de la esfera — pulsa con el audio
  const glowRef = useRef<HTMLDivElement>(null);

  // Refs que el RAF puede leer sin re-crear el loop (evita stale closure)
  const activePresetRef = useRef<BinauralPreset | null>(null);
  const modeRef = useRef<Mode>("binaural");

  useEffect(() => {
    fetch("/api/playlist")
      .then((r) => r.json())
      .then((d) => setTracks(d.tracks ?? []))
      .catch(() => {});
  }, []);

  // Loop de audio — escribe en audioRef compartido del context
  useEffect(() => {
    const tick = (ts: number) => {
      // Lee desde refs — no stale closure aunque el effect no se re-cree
      if (activePresetRef.current) {
        const d = binauralEngineRef.current.sample();
        audioRef.current = { amplitude: d.amplitude, frequency: d.frequency, raw: d.raw };
      } else if (modeRef.current === "file") {
        audioRef.current = fileEngineRef.current.sample();
      } else {
        audioRef.current = { amplitude: 0, frequency: 0, raw: new Uint8Array(0) as Uint8Array<ArrayBuffer> };
      }

      // Glow ambiente — color del preset, intensidad con el beat
      if (glowRef.current) {
        const a = audioRef.current.amplitude;
        const dotColor = activePresetRef.current
          ? BINAURAL_PRESETS[activePresetRef.current].dotColor
          : "#a855f7";
        const intensity = activePresetRef.current ? 0.12 + a * 0.18 : 0.06;
        glowRef.current.style.background =
          `radial-gradient(ellipse 60% 55% at 50% 50%, ${dotColor}${Math.round(intensity * 255).toString(16).padStart(2,"0")} 0%, transparent 70%)`;
      }

      // Actualizar indicador visual en vivo sin disparar re-renders
      if (ampDotRef.current) {
        const a = audioRef.current.amplitude;
        const size = 4 + a * 10; // 4px → 14px según amplitud
        const dotColor = activePresetRef.current
          ? BINAURAL_PRESETS[activePresetRef.current].dotColor
          : "#a855f7";
        ampDotRef.current.style.width  = `${size}px`;
        ampDotRef.current.style.height = `${size}px`;
        ampDotRef.current.style.background = dotColor;
        ampDotRef.current.style.boxShadow = `0 0 8px ${dotColor}, 0 0 16px ${dotColor}40`;
        ampDotRef.current.style.opacity = activePresetRef.current ? "1" : "0";
      }

      if (modeRef.current === "file" && ts - lastProgressUpdate.current > 300) {
        lastProgressUpdate.current = ts;
        const el = htmlAudioRef.current;
        if (el) {
          const p = el.duration > 0 ? el.currentTime / el.duration : 0;
          setProgress((prev) => Math.abs(prev - p) > 0.002 ? p : prev);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      fileEngineRef.current.destroy();
      binauralEngineRef.current.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // selectPreset — handler directo en el click (no useEffect).
  // AudioContext.resume() requiere user gesture activo.
  // Si se llama desde useEffect (post-paint), el browser lo silencia.
  const selectPreset = async (p: BinauralPreset) => {
    const next = activePreset === p ? null : p;
    setActivePreset(next);
    activePresetRef.current = next;

    if (next) {
      await binauralEngineRef.current.start(next, volume); // dentro del gesture
    } else {
      binauralEngineRef.current.stop();
    }
  };

  // File player
  const connectFile = () => {
    if (!htmlAudioRef.current || fileConnected.current) return;
    fileEngineRef.current.connect(htmlAudioRef.current);
    fileConnected.current = true;
  };

  const togglePlay = async () => {
    if (!htmlAudioRef.current || tracks.length === 0) return;
    connectFile();
    await fileEngineRef.current.resume();
    if (playing) { htmlAudioRef.current.pause(); setPlaying(false); }
    else { await htmlAudioRef.current.play(); setPlaying(true); }
  };

  const nextTrack = () => { setCurrentIndex((i) => (i + 1) % Math.max(tracks.length, 1)); setPlaying(false); fileConnected.current = false; };
  const prevTrack = () => { setCurrentIndex((i) => (i - 1 + Math.max(tracks.length, 1)) % Math.max(tracks.length, 1)); setPlaying(false); fileConnected.current = false; };

  const currentTrack = tracks[currentIndex];
  const trackName = currentTrack
    ? decodeURIComponent(currentTrack.split("/").pop() ?? "").replace(/\.(mp3|ogg|wav)$/i, "")
    : null;

  const handleVolume = (v: number) => {
    setVolume(v);
    if (htmlAudioRef.current) htmlAudioRef.current.volume = v;
    binauralEngineRef.current.setVolume(v);
  };

  const presetEntries = Object.entries(BINAURAL_PRESETS) as [BinauralPreset, typeof BINAURAL_PRESETS[BinauralPreset]][];

  return (
    <div className="absolute inset-0">
      {/* Glow ambiente — pulsa con el audio, detrás de todo */}
      <div
        ref={glowRef}
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 55% at 50% 50%, #a855f710 0%, transparent 70%)" }}
      />

      {/* Canvas esfera */}
      <div
        className="absolute inset-0 transition-opacity duration-[2000ms] ease-in"
        style={{ opacity: sphereVisible ? 1 : 0 }}
      >
        <Canvas
          className="absolute inset-0"
          camera={{ position: [0, 0, 3.2], fov: 42 }}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={0.08} />
          <EvaSphere />
        </Canvas>
      </div>

      {/* Audio file element */}
      {currentTrack && (
        <audio
          ref={htmlAudioRef}
          src={currentTrack}
          onEnded={nextTrack}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          style={{ display: "none" }}
          crossOrigin="anonymous"
        />
      )}

      {/* ── Player — estética alien minimal ── */}
      <div className="absolute bottom-8 left-8 z-30 flex flex-col gap-3 select-none">

        {/* Mode tabs — solo si hay tracks */}
        {tracks.length > 0 && (
          <div className="flex gap-2 mb-1">
            {(["binaural", "file"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => handleModeChange(m)}
                className={`font-mono text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 transition-colors ${
                  mode === m ? "text-[#a855f7]" : "text-[#3a3a4a] hover:text-[#71717a]"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        )}

        {/* Binaural — presets como puntos con label */}
        {mode === "binaural" && (
          <div className="flex flex-col gap-1.5">
            {/* Indicador de amplitud en vivo — pulsa con el beat */}
            <span
              ref={ampDotRef}
              className="rounded-full mb-1 opacity-0 transition-none"
              style={{ width: "4px", height: "4px" }}
            />
            {presetEntries.map(([id, cfg]) => {
              const isActive = activePreset === id;
              return (
                <button
                  key={id}
                  onClick={() => selectPreset(id)}
                  className="flex items-center gap-2.5 group"
                  data-cursor
                >
                  {/* Dot indicator */}
                  <span
                    className="w-1.5 h-1.5 rounded-full transition-all duration-300 shrink-0"
                    style={{
                      background: isActive ? cfg.dotColor : "#27272a",
                      boxShadow: isActive ? `0 0 6px ${cfg.dotColor}, 0 0 12px ${cfg.dotColor}40` : "none",
                    }}
                  />
                  <span
                    className={`font-mono text-[10px] transition-colors ${
                      isActive ? "" : "text-[#3a3a4a] group-hover:text-[#71717a]"
                    }`}
                    style={isActive ? { color: cfg.dotColor } : undefined}
                  >
                    {cfg.label}
                  </span>
                  {/* Hz indicator */}
                  <span
                    className="font-mono text-[9px] ml-auto transition-colors"
                    style={{ color: isActive ? `${cfg.dotColor}80` : "#27272a" }}
                  >
                    {cfg.beat}hz
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* File player — mínimo */}
        {mode === "file" && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <button onClick={prevTrack} className="text-[#3a3a4a] hover:text-[#71717a] transition-colors font-mono text-xs">⏮</button>
              <button
                onClick={togglePlay}
                className={`w-8 h-8 flex items-center justify-center border transition-colors text-xs ${
                  playing
                    ? "border-[#a855f7] text-[#a855f7]"
                    : "border-[#27272a] text-[#3a3a4a] hover:border-[#a855f7]/40 hover:text-[#71717a]"
                }`}
                style={{ borderRadius: 0 }}
                disabled={tracks.length === 0}
              >
                {playing ? "⏸" : "▶"}
              </button>
              <button onClick={nextTrack} className="text-[#3a3a4a] hover:text-[#71717a] transition-colors font-mono text-xs">⏭</button>
            </div>
            {trackName && (
              <span className="font-mono text-[9px] text-[#27272a] truncate max-w-[160px]">{trackName}</span>
            )}
            {currentTrack && (
              <div className="w-28 h-px bg-[#1a1a1a] relative">
                <div className="absolute top-0 left-0 h-full bg-[#a855f7]/40" style={{ width: `${progress * 100}%`, transition: "width 0.3s linear" }} />
              </div>
            )}
            {tracks.length === 0 && (
              <span className="font-mono text-[9px] text-[#27272a]">public/audio/</span>
            )}
          </div>
        )}

        {/* Volume — siempre visible, mínimo */}
        <div className="flex items-center gap-2 mt-1">
          <span
            className="w-1 h-1 rounded-full shrink-0"
            style={{ background: "#27272a" }}
          />
          <input
            type="range" min="0" max="1" step="0.05"
            value={volume}
            onChange={(e) => handleVolume(parseFloat(e.target.value))}
            className="w-16"
            style={{
              cursor: "pointer",
              accentColor: "#a855f7",
              opacity: 0.4,
            }}
          />
        </div>
      </div>
    </div>
  );
}
