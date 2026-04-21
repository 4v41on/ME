"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { MetricsCards } from "@/app/components/dashboard/MetricsCards";
import { MemoryList } from "@/app/components/dashboard/MemoryList";
import { MemoryForm } from "@/app/components/dashboard/MemoryForm";
import { ChatInterface } from "@/app/components/chat/ChatInterface";

// MusicPlayer uses Canvas (WebGL) — load client-side only to avoid SSR issues
const MusicPlayer = dynamic(
  () => import("@/app/components/sphere/MusicPlayer").then((m) => m.MusicPlayer),
  { ssr: false }
);

type Tab = "dashboard" | "chat" | "sphere";

export default function Home() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [memoryKey, setMemoryKey] = useState(0);

  const tabs: { id: Tab; label: string }[] = [
    { id: "dashboard", label: "Memorias" },
    { id: "chat", label: "Chat" },
    { id: "sphere", label: "Esfera" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#050508] z-10">
        <span className="font-mono text-[#6C63FF] text-sm uppercase tracking-widest">ME</span>
        <nav className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-mono rounded transition-colors ${
                tab === t.id
                  ? "text-white bg-white/5"
                  : "text-[#8888A0] hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Main */}
      <main className="flex-1 px-6 py-6 max-w-5xl mx-auto w-full">
        {tab === "dashboard" && (
          <div className="flex flex-col gap-6">
            <MetricsCards />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <MemoryForm onSaved={() => setMemoryKey((k) => k + 1)} />
              <MemoryList key={memoryKey} showSearch />
            </div>
          </div>
        )}

        {tab === "chat" && (
          <div style={{ height: "calc(100vh - 10rem)" }} className="flex flex-col">
            <ChatInterface />
          </div>
        )}

        {tab === "sphere" && (
          <div className="flex justify-center py-4">
            <MusicPlayer />
          </div>
        )}
      </main>
    </div>
  );
}
