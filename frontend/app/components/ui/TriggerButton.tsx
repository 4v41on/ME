"use client";

import { useRef, useState } from "react";

interface Props {
  onClick: () => void;
  memoryCount?: number;
}

/**
 * TriggerButton — botón magnético circular que abre el SlideOverPanel.
 * Efecto magnético: el botón se desplaza 0.3x hacia el cursor.
 * Glow violeta pulsante siempre activo.
 */
export function TriggerButton({ onClick, memoryCount = 0 }: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const onMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setOffset({
      x: (e.clientX - cx) * 0.35,
      y: (e.clientY - cy) * 0.35,
    });
  };

  const onMouseLeave = () => setOffset({ x: 0, y: 0 });

  return (
    <button
      ref={ref}
      onClick={onClick}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      data-cursor
      className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-[#a855f7] flex items-center justify-center z-40 select-none"
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        transition: offset.x === 0 && offset.y === 0
          ? "transform 0.5s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.3s"
          : "transform 0.1s ease-out",
        boxShadow: "0 0 24px #a855f7aa, 0 0 48px #a855f740",
        animation: "triggerPulse 3s ease-in-out infinite",
      }}
      aria-label="Abrir panel"
    >
      {/* Símbolo 𒈨 */}
      <span className="text-white font-mono text-lg leading-none select-none">𒈨</span>

      {/* Badge de memorias */}
      {memoryCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#00d4ff] text-black text-[10px] font-mono font-bold flex items-center justify-center">
          {memoryCount > 99 ? "∞" : memoryCount}
        </span>
      )}
    </button>
  );
}
