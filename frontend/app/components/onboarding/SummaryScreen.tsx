"use client";

import { useEffect, useState } from "react";
import { TypewriterText } from "@/app/components/ui/TypewriterText";
import { useSphere } from "@/app/context/SphereContext";

interface Props {
  aiName: string;
  answers: Record<string, string>;
  onComplete: () => void;
}

export function SummaryScreen({ aiName, answers, onComplete }: Props) {
  const work = answers["work"] ?? "";
  const goal = answers["goal_3m"] ?? "";
  const helpType = answers["help_type"] ?? "";
  const archetype = answers["archetype"] ?? "";

  const { setSphereState, setSphereVisible } = useSphere();
  const [lineIndex, setLineIndex] = useState(0);
  const [showButton, setShowButton] = useState(false);

  const lines = [
    `perfil registrado en Šà 𒊮`,
    `${aiName} — ${archetype}`,
    ...(work ? [`trabajo: ${work}`] : []),
    ...(goal ? [`objetivo: ${goal}`] : []),
    ...(helpType ? [`modo: ${helpType}`] : []),
    `sistema listo.`,
  ];

  useEffect(() => {
    // Primer reveal de la esfera — toda la energía acumulada en el onboarding
    setSphereVisible(true);
    setSphereState("born");
    const t = setTimeout(() => setSphereState("alive"), 2500);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLineComplete = (i: number) => {
    if (i < lines.length - 1) {
      setTimeout(() => setLineIndex(i + 1), 400);
    } else {
      setTimeout(() => setShowButton(true), 600);
    }
  };

  const handleComplete = () => {
    setSphereState("alive");
    onComplete();
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
              speed={20}
              cursor={false}
              onComplete={() => handleLineComplete(i)}
            />
          )}
        </p>
      ))}

      {showButton && (
        <button
          onClick={handleComplete}
          data-cursor
          className="mt-6 self-start font-mono text-sm text-[#a1a1aa] hover:text-[#fafafa] transition-colors flex items-center gap-2 group animate-fade-in"
        >
          <span className="text-[#a855f7] group-hover:translate-x-1 transition-transform">→</span>
          entrar
        </button>
      )}
    </div>
  );
}
