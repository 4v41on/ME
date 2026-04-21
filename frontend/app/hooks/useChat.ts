"use client";

import { useState, useEffect, useCallback } from "react";
import { sendMessage, getChatHistory, type ChatMessage } from "@/app/lib/api";

/**
 * useChat — manages multi-turn conversation with the LLM.
 * Loads history on mount and appends new turns optimistically.
 */
export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load conversation history on mount
  useEffect(() => {
    getChatHistory()
      .then(setMessages)
      .catch(() => {});
  }, []);

  const send = useCallback(async (content: string) => {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setError(null);

    try {
      const reply = await sendMessage(content);
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: reply,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      return reply;
    } catch (e) {
      setError(String(e));
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { messages, loading, error, send };
}
