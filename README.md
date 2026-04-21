<div align="center">

<img src="docs/tio-ben.gif" alt="ME" width="100%"/>

# 𒈨 ME

*un sistema de memoria personal que crece contigo*

**Go + SQLite/FTS5 · Next.js · EvaSphere · MCP**

</div>

---

## El nombre

En sumerio antiguo, **me** 𒈨 son los decretos divinos que definen qué es la civilización — la escritura, la sabiduría, el arte, la verdad. No reglas, sino propiedades fundamentales de la existencia. Lo que hace que algo *sea* lo que es.

Este sistema lleva ese nombre porque hace lo mismo contigo: construye, de manera persistente, el mapa de quién eres.

La memoria vive en **Šà** 𒊮 — *corazón* en sumerio. El núcleo del sistema.

---

## Qué es

ME no es una app de notas. Es un agente con memoria persistente — sabe quién eres, cómo piensas, qué estás construyendo. Aprende de cada conversación y evoluciona contigo.

La memoria opera en dos capas:

- **CAG** — contexto estático que el agente lee al inicio de cada sesión: tu perfil, su identidad, cómo se relacionan
- **RAG** — búsqueda full-text sobre todo lo guardado en Šà: tareas, reflexiones, aprendizajes, notas de sesión

La interfaz es secundaria. El flujo principal es **opencode o Claude + Obsidian + Šà via MCP**.

---

## Antes de instalar

| Herramienta | Para qué | Instalador |
|-------------|----------|------------|
| Go 1.21+ | backend + MCP | https://go.dev/dl/ |
| Node.js 18+ LTS | frontend | https://nodejs.org/ |
| gcc / TDM-GCC | SQLite con Go (CGO) | https://jmeubank.github.io/tdm-gcc/ |
| Git | clonar el repo | https://git-scm.com/ |

**Windows:** descarga el `.msi` de Go y Node.js, ejecuta, cierra y abre la terminal.  
**gcc:** TDM-GCC es el más sencillo en Windows — instala y reinicia.

Verifica antes de continuar:
```bash
go version && node --version && npm --version && gcc --version
```

---

## Instalación

```bash
# clona
git clone https://github.com/4v41on/ME.git
cd ME

# verifica dependencias + crea .env + instala módulos
make setup

# compila el servidor MCP — una sola vez
make build-mcp

# levanta todo
make run
```

Abre **http://localhost:3000**

---

## Primera vez

Al abrir el browser aparece el onboarding:

1. **Nombras a tu agente** — el nombre que usará en cada sesión
2. **Eliges un arquetipo** — la personalidad semilla desde la que empieza a crecer

| Arquetipo | Modo |
|-----------|------|
| Athena | estrategia y claridad |
| Hermes | conexiones y velocidad |
| Metis | profundidad antes que respuesta |
| Ishtar | directa, sin rodeos |
| Enki | sistemas y construcción |
| Zeus | decisión y ejecución |

3. **13 preguntas** — quién eres, cómo funcionas, cómo quieres que te hablen

Al terminar, el sistema genera `vault/` con tres archivos: el perfil del agente, el tuyo, y el protocolo de relación entre los dos. Esos archivos van a tu Obsidian — son el contexto estático que el agente lee en cada sesión.

---

## Conectar el MCP

El flujo principal no es el browser — es opencode o Claude Code conectado al MCP.

Crea o edita tu `.mcp.json`:

```json
{
  "mcpServers": {
    "me": {
      "command": "/ruta/absoluta/a/ME/mcp/me-mcp.exe",
      "env": {
        "ME_DB_PATH":    "/ruta/absoluta/a/ME/backend/me.db",
        "ME_VAULT_PATH": "/ruta/absoluta/a/ME/vault",
        "ME_INIT_PATH":  "/ruta/absoluta/a/ME/ME-Init.md"
      }
    }
  }
}
```

En la primera sesión escribe `abrakadabra`. El agente carga todo el contexto y, si es la primera vez, inicia el onboarding conversacional — profundiza lo que el formulario no captura y reescribe el vault con voz real.

---

## Ollama — LLM local (opcional)

El sistema funciona completo sin Ollama. Las memorias, la búsqueda, la esfera y el onboarding no dependen de él.

```bash
# instala desde https://ollama.ai
ollama pull mistral

# activa en .env
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=mistral
```

| RAM | Modelo recomendado |
|-----|--------------------|
| 8 GB | `phi3`, `gemma2:2b` |
| 16 GB | `mistral`, `llama3.2` |
| 32 GB+ | `llama3.1:8b`, `qwen2.5:7b` |

---

## Comandos

```bash
make setup      # primera vez: verifica deps + crea .env + instala
make build-mcp  # compila el servidor MCP (una sola vez)
make run        # backend + frontend en paralelo
make build      # compila todo para producción
make clean      # elimina artefactos (no toca la DB)
make clean-db   # elimina la base de datos — BORRA TODOS LOS DATOS
```

---

## Variables de entorno

| Variable | Default | Descripción |
|----------|---------|-------------|
| `ME_PORT` | `8082` | Puerto del backend |
| `ME_DB_PATH` | `./me.db` | Base de datos SQLite — Šà |
| `ME_VAULT_PATH` | `./vault` | Directorio del vault CAG |
| `ME_INIT_PATH` | `./ME-Init.md` | Init file para el MCP |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8082` | URL del backend desde el browser |
| `OLLAMA_URL` | vacío | URL de Ollama — vacío = deshabilitado |
| `OLLAMA_MODEL` | `mistral` | Modelo Ollama |

---

## Estructura

```
ME/
├── ME-Init.md         ← contexto de sesión para el agente
├── vault/             ← generado en onboarding, copiar a Obsidian
│   ├── AGENT-IDENTITY.md
│   ├── USER-PROFILE.md
│   └── HOW-TO-TALK.md
├── backend/           ← Go 1.21+, SQLite+FTS5, REST API
├── frontend/          ← Next.js 16, Tailwind, React Three Fiber
├── mcp/               ← servidor MCP (me-mcp.exe)
└── docs/              ← API.md, EVASPHERE.md, ONBOARDING.md
```

---

<div align="center">

*parte del ciclo Avalon — EVA → 𒈨 ME → Morgana*

</div>
