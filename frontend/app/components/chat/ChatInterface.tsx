"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@/app/hooks/useChat";

interface OllamaStatus {
  enabled: boolean;
  reachable: boolean;
  model?: string;
  reason?: string;
}

/**
 * ChatInterface — multi-turn conversation with the local LLM.
 *
 * Checks /api/chat/status on mount. If Ollama is not configured or unreachable,
 * shows a setup guide instead of a broken input. The rest of the dashboard
 * is unaffected by Ollama availability.
 */
export function ChatInterface() {
  const { messages, loading, error, send } = useChat();
  const [input, setInput] = useState("");
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Check Ollama availability on mount
  useEffect(() => {
    fetch("/api/chat-status")
      .then((r) => r.json())
      .then(setOllamaStatus)
      .catch(() => setOllamaStatus({ enabled: false, reachable: false, reason: "No se pudo conectar al backend" }));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || loading) return;
    setInput("");
    try {
      await send(content);
    } catch {}
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Loading status
  if (ollamaStatus === null) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-[#8888A0] font-mono text-sm animate-pulse">verificando LLM...</span>
      </div>
    );
  }

  // Ollama not configured or unreachable — setup guide
  if (!ollamaStatus.enabled || !ollamaStatus.reachable) {
    return (
      <div className="flex flex-col gap-6 max-w-md mx-auto py-12">
        <div className="flex flex-col gap-2">
          <span className="text-[#D4AF37] font-mono text-xs uppercase tracking-widest">
            {!ollamaStatus.enabled ? "LLM no configurado" : "Ollama no responde"}
          </span>
          <h3 className="text-white text-lg font-medium">
            El chat requiere un LLM local (Ollama).
          </h3>
          <p className="text-[#8888A0] text-sm">
            {ollamaStatus.reason ?? "Ollama está configurado pero no responde."}
          </p>
        </div>

        <div className="bg-[#0D0D14] border border-white/5 rounded-lg p-5 flex flex-col gap-3">
          <p className="text-[#8888A0] text-xs font-mono uppercase tracking-widest">
            Cómo activarlo
          </p>

          {!ollamaStatus.enabled ? (
            <ol className="flex flex-col gap-2 text-sm text-[#F0F0F5]">
              <li>
                <span className="text-[#8888A0]">1.</span> Instala Ollama desde{" "}
                <span className="text-[#6C63FF] font-mono">ollama.ai</span>
              </li>
              <li>
                <span className="text-[#8888A0]">2.</span> Descarga un modelo:{" "}
                <code className="text-[#00D4FF] font-mono">ollama pull mistral</code>
              </li>
              <li>
                <span className="text-[#8888A0]">3.</span> Agrega a tu{" "}
                <code className="text-[#6C63FF] font-mono">.env</code>:
                <pre className="mt-1 text-[#00D4FF] font-mono text-xs bg-black/30 p-2 rounded">
{`OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=mistral`}
                </pre>
              </li>
              <li>
                <span className="text-[#8888A0]">4.</span> Reinicia:{" "}
                <code className="text-[#00D4FF] font-mono">make run</code>
              </li>
            </ol>
          ) : (
            <ol className="flex flex-col gap-2 text-sm text-[#F0F0F5]">
              <li>
                <span className="text-[#8888A0]">1.</span> Inicia Ollama en tu máquina
              </li>
              <li>
                <span className="text-[#8888A0]">2.</span> Verifica con:{" "}
                <code className="text-[#00D4FF] font-mono">ollama list</code>
              </li>
              <li>
                <span className="text-[#8888A0]">3.</span> Modelo configurado:{" "}
                <code className="text-[#6C63FF] font-mono">{ollamaStatus.model}</code>
              </li>
            </ol>
          )}
        </div>

        <p className="text-[#8888A0] text-xs">
          El resto del sistema (memorias, búsqueda, esfera) funciona sin Ollama.
        </p>
      </div>
    );
  }

  // Ollama available — normal chat
  return (
    <div className="flex flex-col h-full">
      {/* Model indicator */}
      <div className="flex items-center gap-2 pb-3 border-b border-white/5 shrink-0">
        <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
        <span className="text-[#8888A0] text-xs font-mono">{ollamaStatus.model}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 py-3 pr-1 min-h-0">
        {messages.length === 0 && (
          <div className="text-[#8888A0] text-sm font-mono text-center mt-8">
            Inicia una conversación.
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-lg px-4 py-3 text-sm ${
                m.role === "user"
                  ? "bg-[#6C63FF] text-white"
                  : "bg-[#0D0D14] border border-white/5 text-[#F0F0F5]"
              }`}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#0D0D14] border border-white/5 rounded-lg px-4 py-3">
              <span className="text-[#8888A0] text-sm font-mono animate-pulse">▋</span>
            </div>
          </div>
        )}
        {error && (
          <div className="text-[#D4AF37] text-xs font-mono text-center px-4">
            {error.includes("503") || error.includes("unavailable")
              ? "Ollama no responde. ¿Está corriendo?"
              : error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 pt-3 border-t border-white/5 shrink-0">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje... (Enter para enviar)"
          rows={2}
          className="flex-1 bg-[#0D0D14] border border-white/10 rounded px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-[#6C63FF] placeholder:text-[#8888A0]"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="bg-[#6C63FF] hover:bg-[#5a52e0] disabled:opacity-40 text-white text-sm font-mono px-4 rounded transition-colors self-end py-2"
        >
          →
        </button>
      </div>
    </div>
  );
}
