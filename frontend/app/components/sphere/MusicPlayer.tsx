"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { EvaSphere } from "./EvaSphere";
import { AudioEngine, type AudioData } from "./AudioEngine";

// Tracks are detected from /public/audio/ at build time via the API route.
// At runtime the player fetches /api/playlist to get the file list.
const SILENT_AUDIO: AudioData = { amplitude: 0, frequency: 0, raw: new Uint8Array(0) };

/**
 * MusicPlayer — Playlist UI + EvaSphere integration.
 *
 * Detects .mp3/.ogg files from /public/audio/ via GET /api/playlist.
 * User can add files manually to frontend/public/audio/ and restart.
 * The sphere reacts to the playing track in real time.
 */
export function MusicPlayer() {
  const [tracks, setTracks] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [audioData, setAudioData] = useState<AudioData>(SILENT_AUDIO);

  const audioRef = useRef<HTMLAudioElement>(null);
  const engineRef = useRef<AudioEngine>(new AudioEngine());
  const rafRef = useRef<number>(0);
  const engineConnected = useRef(false);

  // Load track list from API route
  useEffect(() => {
    fetch("/api/playlist")
      .then((r) => r.json())
      .then((data) => setTracks(data.tracks ?? []))
      .catch(() => setTracks([]));
  }, []);

  // Animation loop — sample audio every frame
  const tick = useCallback(() => {
    setAudioData(engineRef.current.sample());
    if (audioRef.current) {
      const el = audioRef.current;
      setProgress(el.duration > 0 ? el.currentTime / el.duration : 0);
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      engineRef.current.destroy();
    };
  }, [tick]);

  // Connect audio element to engine when track changes
  useEffect(() => {
    engineConnected.current = false;
  }, [currentIndex]);

  const connectEngine = () => {
    if (!audioRef.current || engineConnected.current) return;
    engineRef.current.connect(audioRef.current);
    engineConnected.current = true;
  };

  const togglePlay = async () => {
    if (!audioRef.current || tracks.length === 0) return;
    connectEngine();
    await engineRef.current.resume();
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      await audioRef.current.play();
      setPlaying(true);
    }
  };

  const next = () => {
    setCurrentIndex((i) => (i + 1) % Math.max(tracks.length, 1));
    setPlaying(false);
    engineConnected.current = false;
  };

  const prev = () => {
    setCurrentIndex((i) => (i - 1 + Math.max(tracks.length, 1)) % Math.max(tracks.length, 1));
    setPlaying(false);
    engineConnected.current = false;
  };

  const handleEnded = () => next();

  const currentTrack = tracks[currentIndex];
  const trackName = currentTrack
    ? decodeURIComponent(currentTrack.split("/").pop() ?? "").replace(/\.(mp3|ogg|wav)$/i, "")
    : "sin tracks";

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* Sphere */}
      <div className="w-full aspect-square max-w-sm rounded-full overflow-hidden">
        <Canvas camera={{ position: [0, 0, 3.5], fov: 45 }}>
          <ambientLight intensity={0.1} />
          <EvaSphere audioData={audioData} />
        </Canvas>
      </div>

      {/* Track name */}
      <div className="text-center">
        <p className="text-[#8888A0] text-xs font-mono uppercase tracking-widest mb-1">
          reproduciendo
        </p>
        <p className="text-white text-sm font-mono truncate max-w-xs">{trackName}</p>
      </div>

      {/* Hidden audio element */}
      {currentTrack && (
        <audio
          ref={audioRef}
          src={currentTrack}
          onEnded={handleEnded}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          style={{ display: "none" }}
          crossOrigin="anonymous"
        />
      )}

      {/* Progress bar */}
      <div className="w-full max-w-xs bg-white/10 rounded-full h-1">
        <div
          className="bg-[#6C63FF] h-1 rounded-full transition-all"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6">
        <button
          onClick={prev}
          className="text-[#8888A0] hover:text-white transition-colors text-lg font-mono"
          disabled={tracks.length === 0}
        >
          ⏮
        </button>
        <button
          onClick={togglePlay}
          className="w-12 h-12 rounded-full bg-[#6C63FF] hover:bg-[#5a52e0] disabled:opacity-40 flex items-center justify-center text-white text-xl transition-colors"
          disabled={tracks.length === 0}
        >
          {playing ? "⏸" : "▶"}
        </button>
        <button
          onClick={next}
          className="text-[#8888A0] hover:text-white transition-colors text-lg font-mono"
          disabled={tracks.length === 0}
        >
          ⏭
        </button>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-3 w-full max-w-xs">
        <span className="text-[#8888A0] text-xs font-mono">VOL</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            setVolume(v);
            if (audioRef.current) audioRef.current.volume = v;
          }}
          className="flex-1 accent-[#6C63FF]"
        />
        <span className="text-[#8888A0] text-xs font-mono w-6">{Math.round(volume * 100)}</span>
      </div>

      {tracks.length === 0 && (
        <p className="text-[#8888A0] text-xs font-mono text-center max-w-xs">
          Agrega archivos .mp3 o .ogg a{" "}
          <code className="text-[#6C63FF]">frontend/public/audio/</code> y reinicia.
        </p>
      )}

      {/* Track list */}
      {tracks.length > 1 && (
        <div className="w-full max-w-xs flex flex-col gap-1 max-h-40 overflow-y-auto">
          {tracks.map((t, i) => {
            const name = decodeURIComponent(t.split("/").pop() ?? "").replace(/\.(mp3|ogg|wav)$/i, "");
            return (
              <button
                key={t}
                onClick={() => {
                  setCurrentIndex(i);
                  setPlaying(false);
                  engineConnected.current = false;
                }}
                className={`text-left text-xs font-mono px-3 py-2 rounded transition-colors ${
                  i === currentIndex
                    ? "text-[#6C63FF] bg-[#6C63FF]/10"
                    : "text-[#8888A0] hover:text-white"
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
