"use client";

import { useEffect, useRef } from "react";

interface Props {
  text: string;
  className?: string;
}

/**
 * GlitchText — texto con efecto glitch RGB-split periódico.
 * Tres capas: base + cian + violeta con mix-blend-multiply.
 * Se dispara aleatoriamente cada 4–8 segundos.
 */
export function GlitchText({ text, className = "" }: Props) {
  const cyanRef = useRef<HTMLSpanElement>(null);
  const violetRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const glitch = () => {
      const cyan = cyanRef.current;
      const violet = violetRef.current;
      if (!cyan || !violet) return;

      // Secuencia rápida de desplazamientos
      const steps = [
        { cx: -4, cy: 0, vx: 4, vy: 1 },
        { cx: 3,  cy: -1, vx: -3, vy: 0 },
        { cx: -2, cy: 1, vx: 2, vy: -1 },
        { cx: 0,  cy: 0, vx: 0, vy: 0 },
      ];

      let i = 0;
      const run = () => {
        if (i >= steps.length) return;
        const s = steps[i];
        cyan.style.transform = `translate(${s.cx}px, ${s.cy}px)`;
        violet.style.transform = `translate(${s.vx}px, ${s.vy}px)`;
        i++;
        setTimeout(run, 50);
      };
      run();

      // Próximo glitch en 4–8s
      const next = 4000 + Math.random() * 4000;
      timeoutId = setTimeout(glitch, next);
    };

    // Primer glitch tras 2s de carga
    timeoutId = setTimeout(glitch, 2000);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <span ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Base */}
      <span className="relative z-10">{text}</span>
      {/* Cian layer */}
      <span
        ref={cyanRef}
        className="absolute inset-0 text-[#00d4ff] mix-blend-multiply pointer-events-none select-none"
        aria-hidden
      >
        {text}
      </span>
      {/* Violeta layer */}
      <span
        ref={violetRef}
        className="absolute inset-0 text-[#a855f7] mix-blend-multiply pointer-events-none select-none"
        aria-hidden
      >
        {text}
      </span>
    </span>
  );
}
