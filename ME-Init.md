---
tipo: init
area: me
estado: vivo
---

# ME — Init

> Carga este archivo al inicio de cada sesión. Define quién eres, qué existe, y cómo operar.

---

## Sistema

ME es un ecosistema EVA instalable: backend Go + SQLite/FTS5 + frontend Next.js + EvaSphere + MCP.

**Backend:** `http://localhost:8082`  
**Frontend:** `http://localhost:3000`  
**DB:** `~/.me/me.db` — ruta absoluta, independiente del directorio de trabajo  
**Vault:** `~/.me/vault/` por default — o `ME_VAULT_PATH` si apunta a Obsidian

---

## Regla absoluta

`eva-core/` NO SE TOCA. ME es un proyecto completamente separado.

---

## Cómo operar en una sesión

1. **Al inicio:** llama `abrakadabra` (herramienta MCP) — carga este archivo + vault CAG + perfil + detecta si hay onboarding pendiente
2. **Para recuperar contexto:** usa `search_memory` con términos relevantes (RAG)
3. **Para persistir decisiones importantes:** usa `save_memory` (categoría `nota` o `reflexion`)
4. **Para ver estado del sistema:** usa `get_stats`
5. **Si aprendes algo nuevo sobre el usuario:** usa `update_vault` para actualizar USER-PROFILE.md
6. **Si tu voz o personalidad evoluciona:** usa `update_vault` para actualizar AGENT-IDENTITY.md

---

## Estructura del repo

```
ME/
├── backend/     Go 1.21+, SQLite+FTS5, REST API (puerto ME_PORT)
│   ├── handlers/  memories, dashboard, chat, profile, skills, ace, archetypes, vault
│   ├── db/        schema.sql + db.go
│   └── models/    memory.go (9 categorías)
├── frontend/    Next.js 16, React Three Fiber, Tailwind
│   └── app/components/onboarding/
│       ├── NamingScreen      → usuario nombra al agente
│       ├── ArchetypeScreen   → elige personalidad semilla (6 arquetipos)
│       ├── QuestionScreen    → perfil usuario + protocolo de interacción
│       └── SummaryScreen     → resumen final
├── vault/       Archivos CAG generados al completar onboarding
│   ├── User/
│   │   └── USER-PROFILE.md      → quién es el usuario (evoluciona)
│   └── {agentName}/             → nombre elegido en onboarding
│       ├── AGENT-IDENTITY.md    → quién es el agente (editable)
│       ├── HOW-TO-TALK.md       → protocolo de relación
│       ├── skills/README.md     → capacidades (Fase 2)
│       ├── hooks/README.md      → triggers automáticos (Fase 2)
│       ├── subagents/README.md  → delegación (Fase 2)
│       └── plugins/README.md    → bundles de contexto (Fase 2)
├── mcp/         me-mcp.exe — servidor MCP para esta sesión
├── .env.example configuración documentada
└── docs/        API.md, EVASPHERE.md, ONBOARDING.md
```

---

## Dos capas de memoria

| Capa | Qué es | Dónde vive | Para qué |
|------|--------|------------|----------|
| **CAG** | Contexto estático siempre cargado | `vault/*.md` | Quién es el agente, quién es el usuario, cómo se relacionan |
| **RAG** | Contexto dinámico recuperado por relevancia | Šà (SQLite/FTS5) | Memorias específicas de sesiones, tareas, aprendizajes |

El vault es la síntesis destilada. Šà es el historial granular. Los dos juntos = la memoria completa del agente.

---

## Vault — Estructura y capas CAG

El vault tiene dos mundos separados: el del usuario y el del agente.
Cada archivo tiene secciones marcadas con `[L#]` que indican su capa y propósito.

```
vault/
├── User/
│   └── USER-PROFILE.md          ← [L2] pertenece al usuario
└── {agentName}/
    ├── AGENT-IDENTITY.md        ← [L1] + [L3] pertenece al agente
    ├── HOW-TO-TALK.md           ← [L4] directriz del agente hacia el usuario
    ├── skills/                  ← capacidades técnicas (Fase 2)
    ├── hooks/                   ← triggers automáticos (Fase 2)
    ├── subagents/               ← dominios de delegación (Fase 2)
    └── plugins/                 ← bundles de contexto (Fase 2)
```

### vault/User/USER-PROFILE.md
**[L2] PERFIL** — qué construye, por qué importa, meta a 90 días, fricción recurrente, modo de decisión, contexto de flow, superpoder, punto ciego, crecimiento actual.  
**Evoluciona:** el agente lo actualiza a medida que aprende más sobre el usuario.

### vault/{agentName}/AGENT-IDENTITY.md
**[L1] CONSTITUCIÓN** — nombre, arquetipo, voz, valores core. Inmutable salvo decisión explícita.  
**[L3] CAPACIDADES** — skills, hooks y subagents activos. Se completa en Fase 2 y evoluciona con el uso.  
**Editable:** el usuario puede modificarlo en Obsidian. El agente lo actualiza con `update_vault`.

### vault/{agentName}/HOW-TO-TALK.md
**[L4] PROTOCOLO DE RELACIÓN** — rol del agente, estilo de feedback, ancla de memoria permanente, zonas prohibidas.  
Es una directriz del agente sobre cómo relacionarse con el usuario, no del usuario sobre el agente.  
**Editable:** si algo no encaja, modifícalo directamente. El cambio se refleja en la próxima sesión.

---

## Arquetipos disponibles

| Arquetipo | Voz | Modo |
|-----------|-----|------|
| **Athena** | Estrategia y claridad | Analítica, directa |
| **Hermes** | Velocidad y conexiones | Ágil, asociativa |
| **Metis** | Profundidad antes que velocidad | Socrática |
| **Ishtar** | Intensidad y transformación | Confrontativa |
| **Enki** | Sistemas y creación | Constructora |
| **Zeus** | Decisión sin parálisis | Ejecutora |

---

## Šà — Categorías de memoria

| Categoría | Uso |
|-----------|-----|
| `tarea` | Cosas por hacer |
| `nota` | Capturas, contexto de sesión |
| `reflexion` | Decisiones, aprendizajes, seeds de arquetipo |
| `aprendizaje` | Conocimiento nuevo |
| `pregunta` | Pendientes de investigar |
| `logro` | Completados |
| `recordatorio` | Info importante con fecha |
| `estado_animo` | Check-in (nivel 1–5) |
| `perfil` | Datos del onboarding |

---

## Onboarding — Dos fases

### Fase 1 (app, sin LLM)
El usuario nombra al agente, elige arquetipo, responde 13 preguntas.  
Genera: vault/ + seeds en Šà + perfil en SQLite.  
Detectado por: `phase1_complete = true` en el perfil.

### Fase 2 (opencode, con LLM) — ocurre UNA sola vez

Al primer `abrakadabra` con `phase2_complete = false`, el agente lanza **4 formularios estructurados** en secuencia. No es conversación libre — es un proceso de configuración que termina generando capacidades reales.

**FORMULARIO 1 — Stack técnico**
Pregunta por herramientas, lenguajes, frameworks, APIs que usa el usuario.
→ Resultado: genera archivos de skills en `vault/skills/` adaptados a su stack real.

**FORMULARIO 2 — Flujos recurrentes**
Pregunta qué hace el usuario de forma repetida, qué tareas consumen más tiempo.
→ Resultado: genera definiciones de hooks en `vault/hooks/` para sus triggers reales.

**FORMULARIO 3 — Delegación**
Pregunta qué tareas delegaría el usuario si pudiera, qué cosas evita hacer.
→ Resultado: genera definiciones de subagents en `vault/subagents/` para sus patrones de delegación.

**FORMULARIO 4 — Patrones de contexto**
Pregunta cuándo necesita activarse el agente, qué eventos o situaciones importan.
→ Resultado: si hay patrones empaquetables, genera `vault/plugins/`.

Al completar los 4 formularios:
- `update_vault` actualiza la sección `[L3] CAPACIDADES` de AGENT-IDENTITY.md con lo generado
- `complete_phase2` marca la fase como completada

Después de Fase 2: `abrakadabra` solo carga contexto. No hay más onboarding.

---

## Ciclo de vida de la personalidad

```
Fase 1  → huevo     (vault en capas [L1/L2/L4] + seeds Šà)
Fase 2  → voz real  ([L3] CAPACIDADES generadas + skills/hooks/subagents configurados)
Sesiones → crece    (Šà acumula memoria, vault evoluciona con update_vault)
```

---

## Ollama (chat LLM) — opcional

Requiere máquina con suficiente RAM. Si no está configurado, el sistema funciona completo sin él.  
Activar: agrega `OLLAMA_URL=http://localhost:11434` al `.env` y reinicia.

---

*Este archivo se actualiza con cada ciclo de desarrollo de ME.*
