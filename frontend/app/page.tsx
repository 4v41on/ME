"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { GlitchText } from "@/app/components/ui/GlitchText";
import { TriggerButton } from "@/app/components/ui/TriggerButton";
import { SlideOverPanel } from "@/app/components/ui/SlideOverPanel";
import { ChatPanel } from "@/app/components/ui/ChatPanel";
import { getProfile } from "@/app/lib/api";
import { useSphereEvents } from "@/app/hooks/useSphereEvents";
import { useSphere } from "@/app/context/SphereContext";

const MusicPlayer = dynamic(
  () => import("@/app/components/sphere/MusicPlayer").then((m) => m.MusicPlayer),
  { ssr: false }
);

interface Profile {
  agentName: string;
  archetype: string;
  memoryCount?: number;
}

export default function Home() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const { setSphereState } = useSphere();

  useSphereEvents();

  useEffect(() => {
    getProfile()
      .then((p) => {
        const nameEntry = p.entries?.find((e: { key: string }) => e.key === "ai_name");
        const archEntry = p.entries?.find((e: { key: string }) => e.key === "archetype");
        if (nameEntry) {
          setProfile({
            agentName: nameEntry.value,
            archetype: archEntry?.value ?? "",
          });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">

      {/* LAYER 0 — EvaSphere fullscreen */}
      <MusicPlayer />

      {/* LAYER 2 — Logo top-left */}
      <div className="fixed top-6 left-6 z-30 select-none">
        <GlitchText
          text="𒈨 ME"
          className="font-mono text-sm text-[#fafafa] tracking-widest uppercase"
        />
      </div>

      {/* LAYER 3 — Agent status top-right */}
      {profile && (
        <div className="fixed top-6 right-6 z-30 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#a855f7] animate-pulse" />
          <span className="font-mono text-xs text-[#71717a] uppercase tracking-widest">
            {profile.agentName}
          </span>
        </div>
      )}

      {/* LAYER 5 — Botones flotantes bottom-right */}
      {/* Chat button — encima del trigger de memorias */}
      <button
        onClick={() => {
          setSphereState("listening");
          setChatOpen(true);
        }}
        className="fixed bottom-24 right-8 z-40 w-10 h-10 border border-[#27272a] hover:border-[#a855f7]/60 flex items-center justify-center text-[#71717a] hover:text-[#fafafa] transition-colors font-mono text-xs"
        style={{ borderRadius: 0 }}
        title="Chat"
      >
        ◈
      </button>

      {/* Trigger memorias */}
      <TriggerButton
        onClick={() => setPanelOpen(true)}
        memoryCount={profile?.memoryCount}
      />

      {/* LAYER 6 — Slide-over panel memorias (derecha) */}
      <SlideOverPanel
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        profile={profile ?? undefined}
      />

      {/* LAYER 6b — Chat panel (izquierda) */}
      <ChatPanel
        isOpen={chatOpen}
        onClose={() => {
          setSphereState("alive");
          setChatOpen(false);
        }}
        agentName={profile?.agentName}
      />
    </div>
  );
}
