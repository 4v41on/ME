"use client";

import { useState, useEffect, useRef } from "react";
import { TypewriterText } from "@/app/components/ui/TypewriterText";

interface Props {
  onNamed: (name: string) => void;
}

const LINES = [
  { text: "sistema iniciando...", delay: 0 },
  { text: "identificando entidad cognitiva...", delay: 900 },
  { text: "se requiere designación.", delay: 1900 },
];

export function NamingScreen({ onNamed }: Props) {
  const [name, setName] = useState("");
  const [linesDone, setLinesDone] = useState(0);
  const [showInput, setShowInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Naming stage: esfera todavía dormida/invisible, el texto toma todo el protagonismo
  // La esfera se activa desde OnboardingFlow.handleNamed tras confirmar el nombre

  useEffect(() => {
    if (linesDone >= LINES.length) {
      const t = setTimeout(() => {
        setShowInput(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [linesDone]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) onNamed(name.trim());
  };

  return (
    <div
      className="flex flex-col gap-5 w-full max-w-sm animate-fade-in rounded-sm px-7 py-8"
      style={{
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {LINES.map((line, i) => (
        <div key={i} className={`font-mono text-sm text-[#b4b4be] ${i > linesDone ? "invisible" : ""}`}>
          {i <= linesDone && (
            <>
              <span className="text-[#a855f7] mr-2">›</span>
              <TypewriterText
                text={line.text}
                speed={30}
                delay={i === 0 ? 0 : 0}
                cursor={i === linesDone && linesDone < LINES.length - 1}
                onComplete={() => setLinesDone((n) => Math.max(n, i + 1))}
              />
            </>
          )}
        </div>
      ))}

      {showInput && (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-6 mt-4 animate-fade-in-up"
        >
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => {}}
              placeholder="_ _ _ _ _ _ _ _"
              autoComplete="off"
              className="w-full bg-transparent border-b border-[#3f3f46] focus:border-[#a855f7] px-0 py-3 text-[#fafafa] font-mono text-lg focus:outline-none placeholder:text-[#3f3f46] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="self-start font-mono text-sm text-[#a1a1aa] hover:text-[#fafafa] disabled:opacity-20 transition-colors flex items-center gap-2 group"
          >
            <span className="text-[#a855f7] group-hover:translate-x-1 transition-transform">→</span>
            continuar
          </button>
        </form>
      )}
    </div>
  );
}
