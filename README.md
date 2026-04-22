<div align="center">

<img src="docs/tio-ben.gif" alt="ME" width="100%"/>

# 𒈨 ME

*un sistema de memoria personal que crece contigo*

**Go + SQLite/FTS5 · Next.js · EvaSphere · MCP**

</div>

---

## ✦ El nombre

En sumerio antiguo, **me** 𒈨 son los decretos divinos que definen qué es la civilización — la escritura, la sabiduría, el arte, la verdad. No reglas, sino propiedades fundamentales de la existencia. Lo que hace que algo *sea* lo que es.

Este sistema lleva ese nombre porque hace lo mismo contigo: construye, de manera persistente, el mapa de quién eres.

La memoria vive en **Šà** 𒊮 — *corazón* en sumerio. El núcleo del sistema.

---

## ◈ Qué es

ME no es una app de notas. Es un agente con memoria persistente — sabe quién eres, cómo piensas, qué estás construyendo. Aprende de cada conversación y evoluciona contigo.

La memoria opera en dos capas:

- **CAG** — contexto estático que el agente lee al inicio de cada sesión: tu perfil, su identidad, cómo se relacionan
- **RAG** — búsqueda full-text sobre todo lo guardado en Šà 𒊮: tareas, reflexiones, aprendizajes, notas de sesión

La interfaz es secundaria. El flujo principal es **opencode o Claude + Obsidian + Šà via MCP**.

---

## ⚙️ Antes de instalar

*Antes de invocar a los dioses, necesitas las herramientas correctas.*

| Herramienta | Para qué | Instalador |
|-------------|----------|------------|
| Go 1.21+ | backend + MCP | https://go.dev/dl/ |
| Node.js 18+ LTS | frontend | https://nodejs.org/ |
| gcc / TDM-GCC | SQLite con Go (CGO) | https://jmeubank.github.io/tdm-gcc/ |
| Git | clonar el repo | https://git-scm.com/ |

**Windows:** descarga el `.msi` de Go y Node.js, ejecútalos, cierra la terminal y vuelve a abrirla. Sí, hay que cerrarla. No, no funciona sin cerrarla.

**gcc:** TDM-GCC es el más sencillo en Windows — instala y reinicia. Sin esto SQLite no compila y el backend no existe.

Cuando tengas todo, verifica:
```bash
go version && node --version && npm --version && gcc --version
```

Si algo falla aquí, no sigas. El sistema te lo agradecerá.

---

## 🚀 Instalación

*Cuatro comandos. Prometido.*

```bash
# el inicio de todo
git clone https://github.com/4v41on/ME.git
cd ME

# verifica dependencias, crea .env, instala módulos Go y npm
make setup

# compila el servidor MCP — solo tienes que hacer esto una vez
make build-mcp

# enciende todo
make run
```

Abre **http://localhost:3000** y empieza.

### Windows sin make

Si `make` no está disponible, instálalo con:
```bash
winget install GnuWin32.Make
```

O corre los comandos manualmente en **dos terminales**:

**Terminal 1 — backend:**
```bash
cd ME/backend
set CGO_CFLAGS=-DSQLITE_ENABLE_FTS5 && set ME_PORT=8082 && set ME_DB_PATH=./me.db && go run .
```

**Terminal 2 — frontend:**
```bash
cd ME/frontend
set NEXT_PUBLIC_API_URL=http://localhost:8082 && npm run dev
```

**Compilar el MCP manualmente:**
```bash
cd ME/mcp
set CGO_CFLAGS=-DSQLITE_ENABLE_FTS5 && go build -o me-mcp.exe .
```

---

## 🌱 Primera vez

El sistema te recibe con el onboarding. No es un formulario — es la primera conversación.

**Paso 1 — Le das un nombre a tu agente.**
El nombre que elijas es el que usará en cada sesión. Tómatelo en serio o no, pero ya no se puede cambiar sin tocar la base de datos. Lo decimos con cariño.

**Paso 2 — Eliges un arquetipo.**
La personalidad semilla. No es definitiva — el agente crece desde ahí via CAG + RAG. Pero define desde dónde empieza a hablar.

| Arquetipo | Modo |
|-----------|------|
| Athena | estrategia y claridad |
| Hermes | conexiones y velocidad |
| Metis | profundidad antes que respuesta |
| Ishtar | directa, sin rodeos |
| Enki | sistemas y construcción |
| Zeus | decisión y ejecución |

*Enki, por cierto, era el guardián de los me 𒈨 en la mitología sumeria. Ishtar fue quien los obtuvo. El círculo es intencional.*

**Paso 3 — 13 preguntas.**
Quién eres, cómo funcionas, cómo quieres que te hablen. Sin trampa, sin truco — el sistema usa exactamente lo que respondes.

Al terminar, `vault/` aparece con tres archivos: el perfil del agente, el tuyo, y el protocolo de relación entre los dos. Esos archivos van a tu Obsidian — son el contexto estático que el agente lee en cada sesión sin que tengas que repetirle nada.

---

## 🔌 Conectar el MCP

*Aquí es donde el sistema cobra vida de verdad.*

El flujo principal no es el browser — es opencode o Claude Code con el MCP activo. El browser es el dashboard. El MCP es el sistema nervioso.

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

En la primera sesión escribe `abrakadabra`.

El agente carga el contexto completo — ME-Init.md, vault, perfil — y si es la primera vez, inicia el onboarding conversacional: profundiza lo que el formulario no puede capturar y reescribe el vault con voz real. A partir de ahí, `abrakadabra` solo activa la sesión.

---

## ◎ EvaSphere

La esfera no es decoración. Es el organismo vivo del sistema.

Vive en la pantalla en todo momento — respira cuando está en reposo, reacciona cuando el sistema piensa, y pulsa al ritmo exacto del sonido cuando los binaural beats están activos.

### Binaural beats

Cinco presets para diferentes estados cognitivos. Cada uno tiene su propio color, velocidad y patrón de movimiento:

| Preset | Beat | Estado | Color |
|--------|------|--------|-------|
| delta | 2 Hz | sueño profundo | índigo |
| theta | 6 Hz | meditación / creatividad | violeta |
| alpha | 10 Hz | relajación / foco suave | rosa |
| beta | 20 Hz | foco activo / alerta | cian |
| gamma | 40 Hz | alta concentración | oro |

El player está abajo a la izquierda. Click en cualquier preset para activarlo — la esfera cambia de color y velocidad en tiempo real. Click de nuevo para detenerlo.

**Nota técnica:** el ritmo que percibes es real — dos osciladores, uno por oído, con la diferencia exacta del beat. Usa auriculares para que funcione correctamente.

---

## 🤖 Ollama — LLM local (opcional)

El sistema funciona completo sin Ollama. Las memorias, la búsqueda, la esfera y el onboarding no lo necesitan.

Si tu máquina lo aguanta:

```bash
# https://ollama.ai
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

Si no tienes Ollama configurado, el tab de chat muestra instrucciones en lugar de un error vacío. No todo el mundo tiene un servidor de modelos en casa — y está bien.

---

## 🛠 Comandos

```bash
make setup      # primera vez: verifica deps + crea .env + instala
make build-mcp  # compila el servidor MCP (una sola vez)
make run        # backend + frontend en paralelo
make build      # compila todo para producción
make clean      # elimina artefactos (no toca la DB)
make clean-db   # elimina la base de datos — BORRA TODO, sin preguntar
```

---

## ⚙️ Variables de entorno

| Variable | Default | Descripción |
|----------|---------|-------------|
| `ME_PORT` | `8082` | Puerto del backend |
| `ME_DB_PATH` | `./me.db` | Base de datos SQLite — Šà 𒊮 |
| `ME_VAULT_PATH` | `./vault` | Directorio del vault CAG |
| `ME_INIT_PATH` | `./ME-Init.md` | Init file para el MCP |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8082` | URL del backend desde el browser |
| `OLLAMA_URL` | vacío | URL de Ollama — vacío = deshabilitado |
| `OLLAMA_MODEL` | `mistral` | Modelo Ollama |

---

## 📁 Estructura

```
ME/
├── ME-Init.md                  ← contexto de sesión para el agente
├── vault/                      ← generado en onboarding, copiar a Obsidian
│   ├── AGENT-IDENTITY.md
│   ├── USER-PROFILE.md
│   └── HOW-TO-TALK.md
├── backend/                    ← Go 1.21+, SQLite+FTS5, REST API
├── frontend/
│   └── app/
│       ├── components/
│       │   ├── sphere/
│       │   │   ├── EvaSphere.tsx      ← shader 3D (Classic Perlin 4D)
│       │   │   ├── BinauralEngine.ts  ← generador de binaural beats
│       │   │   └── MusicPlayer.tsx    ← player + canvas + glow ambiente
│       │   └── onboarding/            ← flujo de onboarding cinematográfico
│       └── context/
│           └── SphereContext.tsx      ← estados de la esfera + audioRef
├── mcp/                        ← servidor MCP (me-mcp.exe)
└── docs/                       ← API.md, EVASPHERE.md, ONBOARDING.md
```

---

<div align="center">

*make with love for enki*

</div>
