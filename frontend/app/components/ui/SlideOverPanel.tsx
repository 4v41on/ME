"use client";

import { useState, useEffect } from "react";
import { MemoryForm } from "@/app/components/dashboard/MemoryForm";
import { MemoryList } from "@/app/components/dashboard/MemoryList";
import { MetricsCards } from "@/app/components/dashboard/MetricsCards";
import { resetProfile } from "@/app/lib/api";

type PanelTab = "memories" | "metrics" | "profile";

interface ProfileData {
  agentName: string;
  archetype: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profile?: ProfileData;
}

/**
 * SlideOverPanel — panel deslizante desde la derecha.
 * Patrón vo1d: isVisible (DOM) + isAnimating (CSS transform).
 * Contiene: Memorias / Métricas / Perfil.
 */
export function SlideOverPanel({ isOpen, onClose, profile }: Props) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeTab, setActiveTab] = useState<PanelTab>("memories");
  const [memoryKey, setMemoryKey] = useState(0);
  const [resetting, setResetting] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

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

  const tabs: { id: PanelTab; label: string }[] = [
    { id: "memories", label: "Memorias" },
    { id: "metrics",  label: "Métricas" },
    { id: "profile",  label: "Perfil" },
  ];

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-350 ${
          isAnimating ? "opacity-60" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`absolute right-0 top-0 h-full w-[460px] max-w-full bg-black border-l border-[#27272a] flex flex-col transition-transform duration-350 ease-out ${
          isAnimating ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272a] shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[#a855f7] text-sm">𒈨</span>
            <span className="font-mono text-[#fafafa] text-sm">
              {profile?.agentName ?? "ME"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#71717a] hover:text-[#fafafa] hover:bg-[#27272a] transition-colors font-mono"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#27272a] shrink-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 px-4 py-3 text-xs font-mono uppercase tracking-widest transition-colors relative ${
                activeTab === t.id
                  ? "text-[#fafafa]"
                  : "text-[#71717a] hover:text-[#a1a1a1]"
              }`}
            >
              {t.label}
              {activeTab === t.id && (
                <span className="absolute bottom-0 left-0 right-0 h-px bg-[#a855f7]" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === "memories" && (
            <div className="flex flex-col gap-5">
              <MemoryForm onSaved={() => setMemoryKey((k) => k + 1)} />
              <MemoryList key={memoryKey} showSearch />
            </div>
          )}

          {activeTab === "metrics" && <MetricsCards />}

          {activeTab === "profile" && (
            <div className="flex flex-col gap-4">
              {profile ? (
                <>
                  <div className="flex flex-col gap-1">
                    <span className="text-[#71717a] font-mono text-xs uppercase tracking-widest">
                      agente
                    </span>
                    <span className="text-[#fafafa] font-mono text-lg">
                      {profile.agentName}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[#71717a] font-mono text-xs uppercase tracking-widest">
                      arquetipo
                    </span>
                    <span className="text-[#a855f7] font-mono text-sm capitalize">
                      {profile.archetype}
                    </span>
                  </div>
                  <div className="mt-4 border-t border-[#27272a] pt-4">
                    <p className="text-[#71717a] text-xs font-mono leading-relaxed">
                      vault/ generado en Šà 𒊮.<br />
                      Copia los archivos a tu Obsidian para activar el contexto estático.
                    </p>
                  </div>

                  {/* Reset de onboarding — debug */}
                  <div className="mt-6 border-t border-[#27272a]/50 pt-4">
                    <span className="text-[#3a3a4a] font-mono text-[9px] uppercase tracking-widest block mb-3">
                      debug
                    </span>
                    {resetError && (
                      <span className="font-mono text-[9px] text-red-500/70 block mb-2 leading-relaxed">
                        {resetError}
                      </span>
                    )}
                    {!resetConfirm ? (
                      <button
                        onClick={() => setResetConfirm(true)}
                        className="font-mono text-[10px] text-[#3a3a4a] hover:text-[#71717a] transition-colors flex items-center gap-2"
                      >
                        <span className="w-1 h-1 rounded-full bg-current shrink-0" />
                        reiniciar onboarding
                      </button>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <span className="font-mono text-[10px] text-[#71717a]">
                          ¿Seguro? Se borrará el perfil.
                        </span>
                        <div className="flex gap-3">
                          <button
                            onClick={async () => {
                              setResetting(true);
                              setResetError(null);
                              try {
                                await resetProfile();
                                window.location.reload();
                              } catch (err) {
                                setResetting(false);
                                setResetConfirm(false);
                                setResetError(err instanceof Error ? err.message : "error");
                              }
                            }}
                            disabled={resetting}
                            className="font-mono text-[10px] text-[#a855f7] hover:text-[#c084fc] transition-colors disabled:opacity-40"
                          >
                            {resetting ? "borrando..." : "confirmar →"}
                          </button>
                          <button
                            onClick={() => setResetConfirm(false)}
                            className="font-mono text-[10px] text-[#3a3a4a] hover:text-[#71717a] transition-colors"
                          >
                            cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-[#71717a] font-mono text-sm">
                  Completa el onboarding para ver tu perfil.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
