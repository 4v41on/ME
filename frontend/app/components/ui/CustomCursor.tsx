"use client";

import { useEffect, useRef } from "react";

/**
 * CustomCursor — ring que sigue al mouse con lerp suave.
 * mix-blend-difference para visibilidad sobre cualquier fondo.
 * Se expande en hover de elementos interactivos.
 */
export function CustomCursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: -100, y: -100, cx: -100, cy: -100 });
  const scale = useRef(1);
  const targetScale = useRef(1);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pos.current.x = e.clientX;
      pos.current.y = e.clientY;
    };

    const onEnterInteractive = () => { targetScale.current = 2.2; };
    const onLeaveInteractive = () => { targetScale.current = 1; };

    const loop = () => {
      const p = pos.current;
      // Lerp suave
      p.cx += (p.x - p.cx) * 0.12;
      p.cy += (p.y - p.cy) * 0.12;
      scale.current += (targetScale.current - scale.current) * 0.15;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${p.cx}px, ${p.cy}px) translate(-50%, -50%) scale(${scale.current})`;
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    // Delegated hover en elementos interactivos
    const addListeners = () => {
      document.querySelectorAll("button, a, input, textarea, [data-cursor]").forEach((el) => {
        el.addEventListener("mouseenter", onEnterInteractive);
        el.addEventListener("mouseleave", onLeaveInteractive);
      });
    };

    window.addEventListener("mousemove", onMove);
    rafRef.current = requestAnimationFrame(loop);
    addListeners();

    // Re-scan cada 2s para elementos dinámicos
    const interval = setInterval(addListeners, 2000);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafRef.current);
      clearInterval(interval);
    };
  }, []);

  return (
    <div
      ref={ringRef}
      className="fixed top-0 left-0 w-9 h-9 rounded-full border border-white pointer-events-none mix-blend-difference z-[9999] will-change-transform"
      style={{ transition: "border-color 0.3s" }}
    />
  );
}
