"use client";

import { useState, useEffect } from "react";
import { ChatInterface } from "@/app/components/chat/ChatInterface";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  agentName?: string;
}

/**
 * ChatPanel — panel deslizante desde la izquierda para el chat con Ollama.
 * Separado de la pantalla principal — accesible solo cuando el usuario lo abre.
 */
export function ChatPanel({ isOpen, onClose, agentName }: Props) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsAnimating(true));
      });
    } else {
      setIsAnimating(false);
      const t = setTimeout(() => setIsVisible(false), 350);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-350 ${
          isAnimating ? "opacity-60" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Panel — desde la izquierda */}
      <div
        className={`absolute left-0 top-0 h-full w-[420px] max-w-full bg-black border-r border-[#27272a] flex flex-col transition-transform duration-350 ease-out ${
          isAnimating ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272a] shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[#a855f7] text-sm">◈</span>
            <span className="font-mono text-[#fafafa] text-sm">
              {agentName ? `chat — ${agentName}` : "chat"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-[#71717a] hover:text-[#fafafa] hover:bg-[#27272a] transition-colors font-mono"
          >
            ✕
          </button>
        </div>

        {/* Chat content */}
        <div className="flex-1 min-h-0 p-4">
          <ChatInterface />
        </div>
      </div>
    </div>
  );
}
