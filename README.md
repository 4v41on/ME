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
| Git | clonar el repo | https://git-scm.com/ |

**Windows:** descarga el `.msi` de Go y Node.js, ejecútalos, cierra la terminal y vuelve a abrirla. Sí, hay que cerrarla. No, no funciona sin cerrarla.

No se necesita GCC ni ningún compilador C — el sistema usa SQLite puro en Go.

Cuando tengas todo, verifica:
```bash
go version && node --version && npm --version
```

Si algo falla aquí, no sigas. El sistema te lo agradecerá.

---

## 🚀 Instalación

```powershell
git clone https://github.com/4v41on/ME.git
cd ME
```

**Instalar dependencias:**
```powershell
cd backend && go mod download && cd ..
cd mcp && go mod download && cd ..
cd frontend && npm install && cd ..
```

**Compilar el MCP (una sola vez):**
```powershell
cd mcp
go build -o me-mcp.exe .
```

**Arrancar el sistema** — dos terminales separadas:

```powershell
# Terminal 1 — backend
cd ME\backend
go run .
```

```powershell
# Terminal 2 — frontend
cd ME\frontend
npm run dev
```

Abre **http://localhost:3000** y empieza.

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

Al terminar, `vault/` aparece con la siguiente estructura:

```
vault/
├── User/
│   └── USER-PROFILE.md       ← quién sos vos (evoluciona con el uso)
└── {nombre del agente}/
    ├── AGENT-IDENTITY.md     ← quién es el agente (editable)
    ├── HOW-TO-TALK.md        ← protocolo de relación
    ├── skills/               ← capacidades (se completan en Fase 2)
    ├── hooks/
    ├── subagents/
    └── plugins/
```

Es el contexto estático que el agente lee en cada sesión sin que tengas que repetirle nada.

**Si usás Obsidian:** apuntá `ME_VAULT_PATH` en `.env` a tu vault de Obsidian (o a una subcarpeta dentro de él) antes de correr el onboarding. Los archivos se generan directamente ahí y podés editarlos, expandirlos con tareas, métricas y notas, y el agente los lee todo junto.

**Si no usás Obsidian:** el vault se genera en `~/.me/vault/` por default (`C:\Users\TuUsuario\.me\vault\` en Windows). Son archivos `.md` — cualquier editor de texto los abre. El sistema funciona igual.

> **Abrí opencode desde la carpeta `ME_VAULT_PATH`** — así carga `CLAUDE.md` y `ME-Init.md` como contexto estático automáticamente.

---

## 🔌 Conectar el MCP

*Aquí es donde el sistema cobra vida de verdad.*

El flujo principal no es el browser — es opencode o Claude Code con el MCP activo. El browser es el dashboard. El MCP es el sistema nervioso.

Hay un template en `mcp.json.example` en la raíz del repo. Copia los valores y reemplaza `ME_PATH` con la ruta donde clonaste el repo.

**opencode** — edita `~/.config/opencode/opencode.json` y agrega en el bloque `"mcp"`:

```json
"me": {
  "type": "local",
  "command": ["C:\\ruta\\a\\ME\\mcp\\me-mcp.exe"],
  "environment": {
    "ME_INIT_PATH": "C:\\ruta\\a\\ME\\ME-Init.md"
  },
  "enabled": true
}
```

`ME_DB_PATH` y `ME_VAULT_PATH` son opcionales — el sistema usa `~/.me/` por default. Solo configúralos si querés rutas personalizadas (ej. apuntar el vault directo a Obsidian).

**Claude Code** — crea `.mcp.json` en tu carpeta de trabajo:

```json
{
  "mcpServers": {
    "me": {
      "command": "C:\\ruta\\a\\ME\\mcp\\me-mcp.exe",
      "env": {
        "ME_INIT_PATH": "C:\\ruta\\a\\ME\\ME-Init.md"
      }
    }
  }
}
```

**Abrí opencode o Claude Code desde la carpeta `ME/vault/`**, no desde la raíz del repo.
El agente usa `CLAUDE.md` y `ME-Init.md` como contexto estático (CAG) al iniciar — abrirlos desde `vault/` garantiza que los lea automáticamente y el RAG funcione desde el primer mensaje.

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

## 🔒 Privacidad

Todo corre en tu máquina. No hay servidores de ME en la nube, no hay cuenta, no hay telemetría.

**Puertos que abre el sistema:**

| Puerto | Qué es | Quién puede acceder |
|--------|--------|-------------------|
| `8082` | Backend — API REST | Solo tu PC (localhost) |
| `3000` | Frontend — la interfaz | Solo tu PC (localhost) |

Ambos escuchan en `127.0.0.1`. Eso significa que ningún otro dispositivo en tu red puede conectarse — solo vos, desde tu propio browser.

**Si Windows Firewall te pregunta** al ejecutar el backend: podés bloquear el acceso a redes públicas y privadas sin problema. El sistema no necesita internet para funcionar.

**Dónde viven tus datos:** en `~/.me/me.db` (`C:\Users\TuUsuario\.me\me.db` en Windows). Tus memorias, tu perfil, tu historial de chat — todo ahí, en tu máquina, siempre en el mismo lugar sin importar desde dónde arranques el servidor. Para desinstalar, borrás esa carpeta y el repo.

**Conexiones externas:** ninguna por defecto. ME es offline. Si configurás Ollama, también corre en tu máquina. La única red que usa el sistema es localhost.

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

```powershell
# Backend
cd ME\backend && go run .

# Frontend
cd ME\frontend && npm run dev

# MCP (compilar una sola vez)
cd ME\mcp && go build -o me-mcp.exe .

# Limpiar binarios (no toca la DB)
Remove-Item ME\mcp\me-mcp.exe -ErrorAction SilentlyContinue

# Eliminar base de datos — BORRA TODO, sin preguntar
Remove-Item "$env:USERPROFILE\.me\me.db" -ErrorAction SilentlyContinue
```

---

## ⚙️ Variables de entorno

| Variable | Default | Descripción |
|----------|---------|-------------|
| `ME_PORT` | `8082` | Puerto del backend |
| `ME_DB_PATH` | `~/.me/me.db` | Base de datos SQLite — Šà 𒊮 |
| `ME_VAULT_PATH` | `~/.me/vault` | Directorio del vault CAG — apuntá a tu vault de Obsidian si usás uno |
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
│   ├── User/
│   │   └── USER-PROFILE.md
│   └── {agentName}/
│       ├── AGENT-IDENTITY.md
│       ├── HOW-TO-TALK.md
│       ├── skills/
│       ├── hooks/
│       ├── subagents/
│       └── plugins/
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
