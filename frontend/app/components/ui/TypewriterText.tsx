"use client";

import { useState, useEffect, useRef } from "react";

interface Props {
  text: string;
  speed?: number; // ms por carácter
  delay?: number; // ms antes de empezar
  className?: string;
  onComplete?: () => void;
  cursor?: boolean;
}

/**
 * TypewriterText — aparece carácter por carácter como una terminal.
 * El cursor parpadeante desaparece al completar (opcional).
 */
export function TypewriterText({
  text,
  speed = 28,
  delay = 0,
  className = "",
  onComplete,
  cursor = true,
}: Props) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    indexRef.current = 0;

    const start = setTimeout(() => {
      const interval = setInterval(() => {
        indexRef.current += 1;
        setDisplayed(text.slice(0, indexRef.current));
        if (indexRef.current >= text.length) {
          clearInterval(interval);
          setDone(true);
          onComplete?.();
        }
      }, speed);
      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(start);
  }, [text, speed, delay, onComplete]);

  return (
    <span className={className}>
      {displayed}
      {cursor && (
        <span
          className={`inline-block w-[2px] h-[1em] bg-current ml-[1px] align-middle ${
            done ? "animate-pulse" : "opacity-100"
          }`}
          aria-hidden
        />
      )}
    </span>
  );
}
