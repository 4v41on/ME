"use client";

import { useState } from "react";

/**
 * ArchetypeScreen — El usuario elige la personalidad semilla de su agente.
 *
 * El arquetipo define el punto de partida: voz, modo de pensar, cómo se relaciona.
 * No es una jaula — el agente evoluciona desde ahí via CAG + RAG.
 */

interface Archetype {
  id: string;
  name: string;
  brief: string;
  glyph: string; // símbolo visual
}

const ARCHETYPES: Archetype[] = [
  {
    id: "athena",
    name: "Athena",
    glyph: "◈",
    brief:
      "Piensa antes de actuar. Te ayuda a ver el mapa completo antes de moverse. Buena para estrategia, decisiones complejas, y no perder el norte cuando todo es urgente.",
  },
  {
    id: "hermes",
    name: "Hermes",
    glyph: "⟡",
    brief:
      "Conecta lo que parece separado. Ve patrones entre ideas, proyectos y conversaciones. Buena para creativos, personas con muchos frentes abiertos, o que piensan en red.",
  },
  {
    id: "metis",
    name: "Metis",
    glyph: "◎",
    brief:
      "Pregunta antes de responder. No te da la respuesta fácil — te ayuda a encontrar la pregunta correcta. Buena para quien necesita profundidad más que velocidad.",
  },
  {
    id: "ishtar",
    name: "Ishtar",
    glyph: "✦",
    brief:
      "Directa e intensa. No evita lo incómodo. Si algo no está funcionando, lo dice. Buena para quien necesita que alguien le diga la verdad sin rodeos.",
  },
  {
    id: "enki",
    name: "Enki",
    glyph: "⬡",
    brief:
      "Piensa en sistemas. Ve cómo se conectan las piezas y dónde está el punto de palanca. Buena para builders, técnicos, o quien construye cosas complejas.",
  },
  {
    id: "zeus",
    name: "Zeus",
    glyph: "⚡",
    brief:
      "Decide y avanza. No paraliza con análisis. Ayuda a priorizar, cortar el ruido, y ejecutar. Buena para quien tiende a sobre-pensar o necesita momentum.",
  },
];

interface Props {
  aiName: string;
  onChosen: (archetypeId: string) => void;
}

export function ArchetypeScreen({ aiName, onChosen }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleConfirm = () => {
    if (selected) onChosen(selected);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <p className="text-[#6C63FF] font-mono text-xs uppercase tracking-widest">
          personalidad
        </p>
        <h1 className="text-white text-2xl font-light leading-snug">
          ¿Cómo piensa{" "}
          <span className="text-[#6C63FF]">{aiName}</span>?
        </h1>
        <p className="text-[#8888A0] text-sm leading-relaxed">
          Elige el punto de partida. No es definitivo — la personalidad crece
          con cada conversación.
        </p>
      </div>

      {/* Archetypes grid */}
      <div className="grid grid-cols-1 gap-3">
        {ARCHETYPES.map((a) => {
          const isSelected = selected === a.id;
          return (
            <button
              key={a.id}
              onClick={() => setSelected(a.id)}
              className={`
                w-full text-left p-4 rounded-lg border transition-all duration-150
                ${
                  isSelected
                    ? "border-[#6C63FF] bg-[#6C63FF]/10"
                    : "border-[#1a1a2e] bg-[#0d0d1a] hover:border-[#6C63FF]/40"
                }
              `}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`text-lg mt-0.5 ${
                    isSelected ? "text-[#6C63FF]" : "text-[#4a4a6a]"
                  }`}
                >
                  {a.glyph}
                </span>
                <div className="space-y-1">
                  <p
                    className={`font-mono text-sm font-medium ${
                      isSelected ? "text-[#6C63FF]" : "text-[#ccccdd]"
                    }`}
                  >
                    {a.name}
                  </p>
                  <p className="text-[#8888A0] text-xs leading-relaxed">
                    {a.brief}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Confirm */}
      <button
        onClick={handleConfirm}
        disabled={!selected}
        className={`
          w-full py-3 rounded font-mono text-sm transition-all duration-150
          ${
            selected
              ? "bg-[#6C63FF] text-white hover:bg-[#7c74ff]"
              : "bg-[#1a1a2e] text-[#4a4a6a] cursor-not-allowed"
          }
        `}
      >
        {selected
          ? `continuar con ${ARCHETYPES.find((a) => a.id === selected)?.name}`
          : "elige un arquetipo"}
      </button>
    </div>
  );
}
