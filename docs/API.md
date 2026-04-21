# API.md — Endpoints ME Backend

Base URL: `http://localhost:8082`

---

## Memorias

### POST /api/memories
```bash
curl -X POST http://localhost:8082/api/memories \
  -H "Content-Type: application/json" \
  -d '{"category":"tarea","title":"Llamar cliente","content":"Confirmar reunión","metadata":"{\"prioridad\":\"alta\",\"completada\":false}","tags":"[\"trabajo\"]"}'
```
Categorías válidas: `tarea | nota | recordatorio | estado_animo | reflexion | logro | aprendizaje | pregunta | perfil`

### GET /api/memories
```bash
curl "http://localhost:8082/api/memories?category=tarea&limit=20&offset=0"
```
Respuesta: `{ memories: Memory[], total: int }`

### GET /api/memories/:id
```bash
curl http://localhost:8082/api/memories/uuid-aqui
```

### PUT /api/memories/:id
```bash
curl -X PUT http://localhost:8082/api/memories/uuid-aqui \
  -H "Content-Type: application/json" \
  -d '{"metadata":"{\"completada\":true}"}'
```

### DELETE /api/memories/:id
```bash
curl -X DELETE http://localhost:8082/api/memories/uuid-aqui
```

### GET /api/search?q=texto
```bash
curl "http://localhost:8082/api/search?q=llamar"
```
Búsqueda FTS5 con BM25 ranking. Retorna: `{ results: Memory[] }`

---

## Dashboard

### GET /api/dashboard
```bash
curl http://localhost:8082/api/dashboard
```
Retorna: total, tareas pendientes, tareas hoy, por categoría, 10 recientes.

---

## Chat

### POST /api/chat
```bash
curl -X POST http://localhost:8082/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"¿Cuáles son mis tareas pendientes?"}'
```
Retorna: `{ message: string }` — respuesta del LLM con el perfil del usuario en el system prompt.

### GET /api/chat/history
```bash
curl http://localhost:8082/api/chat/history
```
Retorna: `{ history: ChatMessage[] }` — últimas 50 mensajes, orden cronológico.

---

## Perfil / Onboarding

### GET /api/profile
```bash
curl http://localhost:8082/api/profile
```
Retorna: `{ entries: ProfileEntry[], onboarding_complete: bool }`

### POST /api/profile
```bash
curl -X POST http://localhost:8082/api/profile \
  -H "Content-Type: application/json" \
  -d '[{"key":"ai_name","value":"EVA"},{"key":"work","value":"Desarrollador"}]'
```

---

## Skills

### GET /api/skills
```bash
curl http://localhost:8082/api/skills
```

### POST /api/skills/:name
```bash
curl -X POST http://localhost:8082/api/skills/daily-summary
curl -X POST http://localhost:8082/api/skills/clear-completed-tasks
```

---

## ACE Loop

### POST /api/ace
```bash
curl -X POST http://localhost:8082/api/ace \
  -H "Content-Type: application/json" \
  -d '{"content":"Contexto importante de esta sesión","title":"Sesión 2026-04-21"}'
```
Mínimo 20 caracteres. Guarda como nota con tag `ace`.

### GET /api/ace/recent
```bash
curl http://localhost:8082/api/ace/recent
```

---

## Health

```bash
curl http://localhost:8082/health
# → {"status":"ok","port":"8082"}
```
