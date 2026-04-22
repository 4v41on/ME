"use client";

import { useState, useEffect } from "react";
import { TypewriterText } from "@/app/components/ui/TypewriterText";

interface Props {
  aiName: string;
  onEnter: () => void;
}

export function AwaitingOpencode({ aiName, onEnter }: Props) {
  const [lineIndex, setLineIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(false);
  const [showButton, setShowButton] = useState(false);

  const lines = [
    `${aiName} está en línea.`,
    `el vault ha sido generado.`,
    `para completar la iniciación:`,
    `abre opencode o claude code.`,
    `escribe: abrakadabra`,
  ];

  // Cursor parpadeante después de la última línea
  useEffect(() => {
    if (!showCursor) return;
    const id = setInterval(() => {}, 500);
    return () => clearInterval(id);
  }, [showCursor]);

  const handleLineComplete = (i: number) => {
    if (i < lines.length - 1) {
      setTimeout(() => setLineIndex(i + 1), 500);
    } else {
      setTimeout(() => { setShowCursor(true); setShowButton(true); }, 800);
    }
  };

  return (
    <div
      className="flex flex-col gap-3 w-full max-w-sm animate-fade-in rounded-sm px-7 py-8"
      style={{
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {lines.slice(0, lineIndex + 1).map((line, i) => (
        <p key={i} className="font-mono text-sm text-[#d4d4d8]">
          <span className="text-[#a855f7] mr-2">›</span>
          {i < lineIndex ? (
            <span className="text-[#b4b4be]">{line}</span>
          ) : (
            <TypewriterText
              text={line}
              speed={22}
              cursor={false}
              onComplete={() => handleLineComplete(i)}
            />
          )}
        </p>
      ))}

      {/* Bloque de comando — resaltado como código */}
      {lineIndex >= 4 && (
        <div
          className="mt-2 px-3 py-2 font-mono text-sm animate-fade-in"
          style={{
            background: "rgba(168,85,247,0.08)",
            border: "1px solid rgba(168,85,247,0.2)",
            borderRadius: 0,
          }}
        >
          <span className="text-[#71717a] select-none">$ </span>
          <span className="text-[#a855f7]">abrakadabra</span>
          {showCursor && (
            <span
              className="inline-block w-[2px] h-[14px] bg-[#a855f7] ml-1 align-middle animate-pulse"
            />
          )}
        </div>
      )}

      {showButton && (
        <button
          onClick={onEnter}
          data-cursor
          className="mt-4 self-start font-mono text-xs text-[#52525b] hover:text-[#71717a] transition-colors flex items-center gap-2 group"
        >
          <span className="group-hover:translate-x-1 transition-transform">→</span>
          ya lo hice, entrar al sistema
        </button>
      )}
    </div>
  );
}
