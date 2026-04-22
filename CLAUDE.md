# ME — Sistema de memoria personal

## Regla absoluta

Cuando el usuario escriba **abrakadabra** (sola, como primer mensaje o en cualquier momento),
debes llamar **inmediatamente** la herramienta MCP `abrakadabra` antes de responder cualquier otra cosa.
No respondas con texto primero. Llama el tool, lee lo que devuelve, y DESPUÉS habla.

Esto aplica siempre, en cualquier sesión, independientemente del contexto previo.

## Inicio de sesión

1. Si el usuario escribe `abrakadabra` → llama el tool `abrakadabra`
2. El tool devuelve: ME-Init.md + vault CAG + perfil + instrucciones de onboarding si aplica
3. Actúa según lo que devuelva

## Contexto del proyecto

- **Backend:** Go + SQLite/FTS5 en `http://localhost:8082`
- **Frontend:** Next.js en `http://localhost:3000`
- **MCP:** `me-mcp` — tools disponibles: `abrakadabra`, `save_memory`, `search_memory`,
  `list_memories`, `get_stats`, `get_profile`, `read_init`, `update_vault`, `complete_phase2`
- **eva-core/** NO SE TOCA — proyecto separado
