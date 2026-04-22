"use client";

import { useState, useEffect } from "react";
import { TypewriterText } from "@/app/components/ui/TypewriterText";
import { useSphere } from "@/app/context/SphereContext";

interface Archetype {
  id: string;
  name: string;
  glyph: string;
  keywords: string[];
}

const ARCHETYPES: Archetype[] = [
  { id: "athena", name: "Athena", glyph: "◈", keywords: ["estrategia", "claridad", "mapa"] },
  { id: "hermes", name: "Hermes", glyph: "⟡", keywords: ["conexiones", "patrones", "velocidad"] },
  { id: "metis",  name: "Metis",  glyph: "◎", keywords: ["profundidad", "pregunta", "verdad"] },
  { id: "ishtar", name: "Ishtar", glyph: "✦", keywords: ["directa", "intensidad", "sin rodeos"] },
  { id: "enki",   name: "Enki",   glyph: "⬡", keywords: ["sistemas", "construcción", "palanca"] },
  { id: "zeus",   name: "Zeus",   glyph: "⚡", keywords: ["decisión", "ejecución", "momentum"] },
];

interface Props {
  aiName: string;
  onChosen: (archetypeId: string) => void;
}

export function ArchetypeScreen({ aiName, onChosen }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [headerDone, setHeaderDone] = useState(false);
  const { setSphereState } = useSphere();

  useEffect(() => {
    setSphereState("listening");
  }, [setSphereState]);

  const handleConfirm = () => {
    if (selected) {
      setSphereState("thinking");
      onChosen(selected);
    }
  };

  const glassStyle: React.CSSProperties = {
    background: "rgba(0,0,0,0.55)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    border: "1px solid rgba(255,255,255,0.06)",
  };

  return (
    <div
      className="flex flex-col gap-6 w-full max-w-sm animate-fade-in rounded-sm px-7 py-8"
      style={glassStyle}
    >
      {/* Header */}
      <div className="flex flex-col gap-2">
        <p className="font-mono text-sm text-[#b4b4be]">
          <span className="text-[#a855f7] mr-2">›</span>
          <TypewriterText
            text={`designación confirmada: ${aiName}`}
            speed={25}
            onComplete={() => setHeaderDone(true)}
          />
        </p>
        {headerDone && (
          <p className="font-mono text-sm text-[#b4b4be] animate-fade-in">
            <span className="text-[#a855f7] mr-2">›</span>
            <TypewriterText text="elige el núcleo." speed={30} cursor={false} />
          </p>
        )}
      </div>

      {/* Grid 2x3 */}
      {headerDone && (
        <div className="grid grid-cols-2 gap-2 animate-fade-in-up">
          {ARCHETYPES.map((a) => {
            const isSelected = selected === a.id;
            return (
              <button
                key={a.id}
                onClick={() => {
                  setSelected(a.id);
                  setSphereState("growing");
                  setTimeout(() => setSphereState("listening"), 600);
                }}
                data-cursor
                className={`
                  text-left p-4 border transition-all duration-200 flex flex-col gap-2
                  ${isSelected
                    ? "border-[#a855f7] bg-[#a855f7]/10"
                    : "border-white/10 bg-white/[0.02] hover:border-[#a855f7]/50 hover:bg-white/[0.04]"
                  }
                `}
                style={{ borderRadius: 0 }}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-base ${isSelected ? "text-[#a855f7]" : "text-[#a1a1aa]"}`}>
                    {a.glyph}
                  </span>
                  <span className={`font-mono text-sm ${isSelected ? "text-[#fafafa]" : "text-[#d4d4d8]"}`}>
                    {a.name}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {a.keywords.map((k) => (
                    <span key={k} className="text-[10px] font-mono text-[#a1a1aa] uppercase tracking-wide">
                      {k}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Confirm */}
      {selected && (
        <button
          onClick={handleConfirm}
          data-cursor
          className="self-start font-mono text-sm text-[#a1a1aa] hover:text-[#fafafa] transition-colors flex items-center gap-2 group animate-fade-in"
        >
          <span className="text-[#a855f7] group-hover:translate-x-1 transition-transform">→</span>
          continuar con {ARCHETYPES.find((a) => a.id === selected)?.name}
        </button>
      )}
    </div>
  );
}
