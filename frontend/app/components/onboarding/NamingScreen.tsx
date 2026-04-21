"use client";

import { useState } from "react";

interface Props {
  onNamed: (name: string) => void;
}

/**
 * NamingScreen — first screen of onboarding.
 * The user names their AI. This name appears everywhere in the system.
 */
export function NamingScreen({ onNamed }: Props) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) onNamed(name.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8 w-full max-w-lg">
      <div className="flex flex-col gap-2">
        <span className="text-[#6C63FF] text-xs font-mono uppercase tracking-widest">
          Primer paso
        </span>
        <h2 className="text-white text-2xl font-medium leading-relaxed">
          ¿Cómo se llama tu IA?
        </h2>
        <p className="text-[#8888A0] text-sm">
          Este nombre aparece en todo el sistema. Puedes cambiarlo después.
        </p>
      </div>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre de tu IA..."
        autoFocus
        className="bg-[#0D0D14] border border-white/10 rounded-lg px-4 py-4 text-white text-lg focus:outline-none focus:border-[#6C63FF] placeholder:text-[#8888A0]"
      />

      <button
        type="submit"
        disabled={!name.trim()}
        className="bg-[#6C63FF] hover:bg-[#5a52e0] disabled:opacity-30 text-white font-mono py-3 px-6 rounded-lg transition-colors self-start"
      >
        Continuar →
      </button>
    </form>
  );
}
