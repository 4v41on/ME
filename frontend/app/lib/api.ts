/**
 * api.ts — HTTP client for the ME backend.
 *
 * All functions return typed results or throw on network/server errors.
 * Base URL reads from NEXT_PUBLIC_API_URL env var, defaults to localhost:8082.
 */

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8082";

// --- Types ---

export interface Memory {
  id: string;
  category: string;
  title: string;
  content: string;
  metadata: string;
  tags: string;
  created_at: string;
  updated_at: string;
}

export interface MemoryListResponse {
  memories: Memory[];
  total: number;
}

export interface DashboardStats {
  total_memories: number;
  tareas_pendientes: number;
  tareas_hoy: number;
  por_categoria: Record<string, number>;
  recientes: Memory[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface ProfileEntry {
  key: string;
  value: string;
  updated_at?: string;
}

export interface ProfileResponse {
  entries: ProfileEntry[];
  onboarding_complete: boolean;
  phase1_complete: boolean;
  phase2_complete: boolean;
}

export interface OnboardingCompleteRequest {
  ai_name: string;
  archetype: string;
  answers: ProfileEntry[];
}

export interface OnboardingCompleteResponse {
  ok: boolean;
  vault_path?: string;
  files_generated?: string[];
  vault_warning?: string;
  phase1_complete: boolean;
}

// --- Memory API ---

export async function getMemories(params?: {
  category?: string;
  limit?: number;
  offset?: number;
}): Promise<MemoryListResponse> {
  const q = new URLSearchParams();
  if (params?.category) q.set("category", params.category);
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.offset) q.set("offset", String(params.offset));
  const res = await fetch(`${BASE}/api/memories?${q}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getMemory(id: string): Promise<Memory> {
  const res = await fetch(`${BASE}/api/memories/${id}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createMemory(data: {
  category: string;
  title?: string;
  content: string;
  metadata?: string;
  tags?: string;
}): Promise<Memory> {
  const res = await fetch(`${BASE}/api/memories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateMemory(
  id: string,
  data: { title?: string; content?: string; metadata?: string; tags?: string }
): Promise<{ id: string; updated_at: string }> {
  const res = await fetch(`${BASE}/api/memories/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteMemory(id: string): Promise<void> {
  const res = await fetch(`${BASE}/api/memories/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text());
}

export async function searchMemories(q: string): Promise<Memory[]> {
  const res = await fetch(`${BASE}/api/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.results ?? [];
}

// --- Dashboard ---

export async function getDashboard(): Promise<DashboardStats> {
  const res = await fetch(`${BASE}/api/dashboard`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// --- Chat ---

export async function sendMessage(message: string): Promise<string> {
  const res = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.message;
}

export async function getChatHistory(): Promise<ChatMessage[]> {
  const res = await fetch(`${BASE}/api/chat/history`);
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.history ?? [];
}

// --- Profile / Onboarding ---

export async function getProfile(): Promise<ProfileResponse> {
  const res = await fetch(`${BASE}/api/profile`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function saveProfile(entries: ProfileEntry[]): Promise<void> {
  const res = await fetch(`${BASE}/api/profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entries),
  });
  if (!res.ok) throw new Error(await res.text());
}

// completeOnboarding — Fase 1 completa.
// Guarda perfil + genera vault/ + planta seeds en Šà en un solo request.
export async function completeOnboarding(
  data: OnboardingCompleteRequest
): Promise<OnboardingCompleteResponse> {
  const res = await fetch(`${BASE}/api/onboarding/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// --- ACE ---

export async function saveContext(content: string, title?: string): Promise<void> {
  const res = await fetch(`${BASE}/api/ace`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, title }),
  });
  if (!res.ok) throw new Error(await res.text());
}
