import { NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8082";

/**
 * GET /api/chat-status
 *
 * Proxies /api/chat/status from the Go backend.
 * Returns whether Ollama is configured and reachable.
 * The ChatInterface uses this to show a setup guide instead of a broken UI.
 */
export async function GET() {
  try {
    const res = await fetch(`${BACKEND}/api/chat/status`, { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({
      enabled: false,
      reachable: false,
      reason: "No se pudo conectar al backend. ¿Está corriendo make run?",
    });
  }
}
