"use client";

import { useState } from "react";
import { TypewriterText } from "@/app/components/ui/TypewriterText";

interface Props {
  aiName: string;
  vaultPath?: string;
  onEnter: () => void;
}

export function AwaitingOpencode({ aiName, vaultPath, onEnter }: Props) {
  const [lineIndex, setLineIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  // El backend genera el vault en ME_VAULT_PATH (default: ME/vault/)
  const vaultDisplay = vaultPath ?? "ME/vault/";

  const lines = [
    `${aiName} está en línea.`,
    `el vault ha sido generado.`,
    `para completar la iniciación:`,
    `abre opencode o claude code desde el vault.`,
    `escribe: abrakadabra`,
  ];

  const handleLineComplete = (i: number) => {
    if (i < lines.length - 1) {
      setTimeout(() => setLineIndex(i + 1), 500);
    } else {
      setTimeout(() => { setShowCursor(true); setShowButton(true); }, 800);
    }
  };

  return (
    <div
      className="flex flex-col gap-3 w-full max-w-sm animate-fade-in rounded-sm px-7 py-8"
      style={{
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {lines.slice(0, lineIndex + 1).map((line, i) => (
        <p key={i} className="font-mono text-sm text-[#d4d4d8]">
          <span className="text-[#a855f7] mr-2">›</span>
          {i < lineIndex ? (
            <span className="text-[#b4b4be]">{line}</span>
          ) : (
            <TypewriterText
              text={line}
              speed={22}
              cursor={false}
              onComplete={() => handleLineComplete(i)}
            />
          )}
        </p>
      ))}

      {/* Bloque de comando */}
      {lineIndex >= 4 && (
        <div
          className="mt-2 px-3 py-2 font-mono text-sm animate-fade-in"
          style={{
            background: "rgba(168,85,247,0.08)",
            border: "1px solid rgba(168,85,247,0.2)",
            borderRadius: 0,
          }}
        >
          <span className="text-[#71717a] select-none">$ </span>
          <span className="text-[#a855f7]">abrakadabra</span>
          {showCursor && (
            <span className="inline-block w-[2px] h-[14px] bg-[#a855f7] ml-1 align-middle animate-pulse" />
          )}
        </div>
      )}

      {/* Vault path + nota Obsidian */}
      {showButton && (
        <div className="mt-1 flex flex-col gap-2 animate-fade-in">
          <p className="font-mono text-xs text-[#52525b]">
            <span className="text-[#71717a] mr-2">›</span>
            vault generado en:{" "}
            <span className="text-[#a1a1aa] break-all">{vaultDisplay}</span>
          </p>
          <p className="font-mono text-xs text-[#52525b] leading-relaxed"
            style={{ borderLeft: "1px solid rgba(168,85,247,0.15)", paddingLeft: "10px" }}
          >
            abrí opencode desde esa carpeta — así carga el contexto estático automáticamente.<br />
            <span className="text-[#3f3f46]">si usás Obsidian, apuntá{" "}
              <span className="text-[#52525b]">ME_VAULT_PATH</span> a tu vault para editar y expandir desde ahí.
            </span>
          </p>
        </div>
      )}

      {/* Toggle setup MCP */}
      {showButton && (
        <button
          onClick={() => setShowSetup((v) => !v)}
          data-cursor
          className="mt-2 self-start font-mono text-xs text-[#52525b] hover:text-[#71717a] transition-colors flex items-center gap-1"
        >
          <span className="text-[#a855f7]">{showSetup ? "▾" : "▸"}</span>
          ¿cómo configuro el MCP?
        </button>
      )}

      {showSetup && (
        <div
          className="flex flex-col gap-2 animate-fade-in font-mono text-xs"
          style={{
            borderLeft: "1px solid rgba(168,85,247,0.2)",
            paddingLeft: "12px",
          }}
        >
          <p className="text-[#71717a]">1. compila el servidor MCP (una sola vez):</p>
          <div
            className="px-2 py-1.5"
            style={{ background: "rgba(255,255,255,0.03)", borderRadius: 0 }}
          >
            <span className="text-[#52525b] select-none">$ </span>
            <span className="text-[#d4d4d8]">cd mcp && go build -o me-mcp.exe .</span>
          </div>

          <p className="text-[#71717a] mt-1">2. crea <span className="text-[#a1a1aa]">.mcp.json</span> en tu proyecto:</p>
          <div
            className="px-2 py-2 text-[10px] leading-relaxed"
            style={{ background: "rgba(255,255,255,0.03)", borderRadius: 0 }}
          >
            <span className="text-[#71717a]">{"{"}</span><br />
            <span className="text-[#71717a] ml-2">&quot;mcpServers&quot;:</span>
            <span className="text-[#71717a]"> {"{"}</span><br />
            <span className="text-[#71717a] ml-4">&quot;me&quot;:</span>
            <span className="text-[#71717a]"> {"{"}</span><br />
            <span className="text-[#71717a] ml-6">&quot;command&quot;:</span>
            <span className="text-[#a855f7]"> &quot;/ruta/a/ME/mcp/me-mcp.exe&quot;</span><span className="text-[#71717a]">,</span><br />
            <span className="text-[#71717a] ml-6">&quot;env&quot;:</span>
            <span className="text-[#71717a]"> {"{"}</span><br />
            <span className="text-[#71717a] ml-8">&quot;ME_DB_PATH&quot;:</span>
            <span className="text-[#a1a1aa]"> &quot;/ruta/a/ME/backend/me.db&quot;</span><span className="text-[#71717a]">,</span><br />
            <span className="text-[#71717a] ml-8">&quot;ME_VAULT_PATH&quot;:</span>
            <span className="text-[#a1a1aa]"> &quot;/ruta/a/ME/vault&quot;</span><span className="text-[#71717a]">,</span><br />
            <span className="text-[#71717a] ml-8">&quot;ME_INIT_PATH&quot;:</span>
            <span className="text-[#a1a1aa]"> &quot;/ruta/a/ME/ME-Init.md&quot;</span><br />
            <span className="text-[#71717a] ml-6">{"}"}</span><br />
            <span className="text-[#71717a] ml-4">{"}"}</span><br />
            <span className="text-[#71717a] ml-2">{"}"}</span><br />
            <span className="text-[#71717a]">{"}"}</span>
          </div>
          <p className="text-[#52525b]">usa rutas absolutas — sin <span className="text-[#71717a]">./</span></p>
        </div>
      )}

      {showButton && (
        <button
          onClick={onEnter}
          data-cursor
          className="mt-4 self-start font-mono text-xs text-[#52525b] hover:text-[#71717a] transition-colors flex items-center gap-2 group"
        >
          <span className="group-hover:translate-x-1 transition-transform">→</span>
          ya lo hice, entrar al sistema
        </button>
      )}
    </div>
  );
}
