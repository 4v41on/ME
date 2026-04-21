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

**Repo:** `D:/Users/User/Documents/ME/`  
**DB:** `D:/Users/User/Documents/ME/backend/me.db`  
**Backend:** `http://localhost:8082`  
**Frontend:** `http://localhost:3000`

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
│   ├── AGENT-IDENTITY.md    → quién es el agente (editable)
│   ├── USER-PROFILE.md      → quién es el usuario (evoluciona)
│   └── HOW-TO-TALK.md       → protocolo de relación
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

## Vault — Archivos CAG

### AGENT-IDENTITY.md
Define quién es el agente: nombre, arquetipo, voz, rasgos core.  
**Editable:** el usuario puede modificarlo en Obsidian. El agente puede actualizarlo con `update_vault`.

### USER-PROFILE.md
Define quién es el usuario: trabajo, metas, cómo funciona, fortalezas, puntos ciegos.  
**Evoluciona:** el agente lo actualiza a medida que aprende más sobre el usuario.

### HOW-TO-TALK.md
Define el protocolo de relación: qué tipo de ayuda quiere el usuario y cómo quiere que le hablen.  
**Editable:** si el estilo no encaja, el usuario o el agente pueden modificarlo.

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
Al primer `abrakadabra` con `phase2_complete = false`, el agente:
1. Se presenta con la voz del arquetipo elegido
2. Ya sabe el perfil base (lo leyó del vault)
3. Profundiza lo que el formulario no captura
4. Al terminar: actualiza vault/ con `update_vault` + llama `complete_phase2`

Después de Fase 2: `abrakadabra` solo carga contexto, no hay más onboarding.

---

## Ciclo de vida de la personalidad

```
Fase 1  → huevo (vault template + seeds Šà)
Fase 2  → voz real (vault reescrito por LLM + RAG enriquecido)
Sesiones → el agente crece (Šà acumula, vault evoluciona)
```

---

## Ollama (chat LLM) — opcional

Requiere máquina con suficiente RAM. Si no está configurado, el sistema funciona completo sin él.  
Activar: agrega `OLLAMA_URL=http://localhost:11434` al `.env` y reinicia.

---

*Este archivo se actualiza con cada ciclo de desarrollo de ME.*
