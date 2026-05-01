# INSTALL.md — Instalación en PC nueva

Guía paso a paso para instalar ME en una máquina desde cero.

---

## Prerrequisitos

Instala estas herramientas antes de continuar. Sin ellas el sistema no compila.

| Herramienta | Para qué | Dónde |
|-------------|----------|-------|
| Go 1.21+ | backend + MCP | https://go.dev/dl/ — descarga el `.msi` |
| Node.js 18+ LTS | frontend | https://nodejs.org/ — descarga el `.msi` |
| Git | clonar el repo | https://git-scm.com/ |

No se necesita GCC ni ningún compilador C.

**Después de instalar cada herramienta: cierra la terminal y vuelve a abrirla.**
El PATH no se actualiza en terminales ya abiertas.

Verifica que todo esté listo:
```powershell
go version && node --version && npm --version
```

Si algo falla aquí, no sigas.

---

## Instalación

```bash
# 1. Clona el repo
git clone https://github.com/4v41on/ME.git
cd ME

# 2. Verifica deps + crea .env + instala módulos
make setup

# 3. Compila el servidor MCP (una sola vez)
make build-mcp

# 4. Enciende todo
make run
```

Abre **http://localhost:3000** — deberías ver el onboarding.

### Windows (PowerShell)

En **dos terminales** separadas:

**Terminal 1 — backend:**
```powershell
cd ME\backend
go run .
```

**Terminal 2 — frontend:**
```powershell
cd ME\frontend
npm run dev
```

**Compilar MCP (una sola vez):**
```powershell
cd ME\mcp
go build -o me-mcp.exe .
```

---

## Configurar el MCP (para opencode / Claude Code)

El MCP es lo que conecta al agente con la memoria. Sin esto, el agente no puede guardar ni recuperar contexto.

**Paso 1:** Compila el servidor (si no lo hiciste ya):
```bash
make build-mcp
# genera: ME/mcp/me-mcp.exe
```

**Paso 2:** Crea `.mcp.json` en la raíz de tu proyecto de trabajo:

```json
{
  "mcpServers": {
    "me": {
      "command": "C:/Users/TuUsuario/ME/mcp/me-mcp.exe",
      "env": {
        "ME_DB_PATH":    "C:/Users/TuUsuario/ME/backend/me.db",
        "ME_VAULT_PATH": "C:/Users/TuUsuario/ME/vault",
        "ME_INIT_PATH":  "C:/Users/TuUsuario/ME/ME-Init.md"
      }
    }
  }
}
```

> Reemplaza `C:/Users/TuUsuario/ME` con la ruta absoluta donde clonaste el repo.
> Usa barras `/` aunque estés en Windows — tanto opencode como Claude Code las entienden.

**Paso 3:** Abre opencode o Claude Code **desde la carpeta `ME/vault/`** y escribe `abrakadabra`.

> **¿Por qué desde `vault/`?**
> El agente carga `CLAUDE.md` y `ME-Init.md` como contexto estático (CAG) al iniciar.
> Si abres opencode desde otra carpeta, esos archivos no se cargan automáticamente y el agente empieza sin contexto — el RAG funciona pero el CAG no.
> Abrirlo desde `vault/` es lo que activa la memoria completa desde el primer mensaje.

---

## Obsidian (opcional pero recomendado)

El onboarding genera tres archivos en `ME_VAULT_PATH`:
- `AGENT-IDENTITY.md` — quién es el agente
- `USER-PROFILE.md` — quién eres tú
- `HOW-TO-TALK.md` — cómo se relacionan

**Si usas Obsidian**, la forma más limpia es apuntar `ME_VAULT_PATH` directamente a tu vault (o a una subcarpeta dentro de él) **antes de correr el onboarding**. Los archivos se generan ahí y Obsidian los ve sin pasos extra.

```bash
# En .env — apunta a donde quieras que vivan los archivos del agente
ME_VAULT_PATH=C:/Users/TuUsuario/Documents/Obsidian Vault/ME
```

Con esto puedes agregar tareas, métricas y notas al mismo vault, y el agente las leerá como contexto en cada sesión.

**Si no usas Obsidian**, deja el default `../vault` — el agente lee los `.md` directo desde disco sin necesitar Obsidian.

> **Abre opencode siempre desde `ME_VAULT_PATH`** — ahí viven `CLAUDE.md` y `ME-Init.md`, que el agente carga como contexto estático (CAG) al iniciar.

---

## Seguridad y privacidad

Antes de instalar, esto es lo que el sistema hace y lo que no hace:

### Todo corre en tu máquina

ME no tiene servidores en la nube. No hay cuenta, no hay login, no hay suscripción.
Todo — el backend, la base de datos, el vault — vive en tu PC.

### Puertos que usa el sistema

| Puerto | Servicio | Acceso |
|--------|---------|--------|
| `8082` | Backend Go (API REST) | **solo localhost** — no accesible desde otras PCs |
| `3000` | Frontend Next.js | **solo localhost** — solo tu browser puede conectarse |

Ambos puertos escuchan en `127.0.0.1` (loopback). Eso significa que solo tú, desde tu propia máquina, puedes acceder a ellos. Ningún otro dispositivo en tu red puede conectarse.

### Si Windows Firewall te pregunta

Cuando ejecutas el backend por primera vez, Windows puede mostrar un aviso de firewall para `go.exe` o `node.exe`. **Puedes bloquear el acceso a redes públicas y privadas sin ningún problema** — el sistema solo necesita localhost para funcionar. No necesita internet.

### Dónde se guardan tus datos

Todo está en un único archivo SQLite en tu máquina:

```
ME/backend/me.db
```

Contiene:
- Tu perfil (respuestas del onboarding)
- Tus memorias (lo que guardas con `save_memory`)
- El historial de chat (conversaciones con el agente)

**Nadie más tiene acceso a este archivo.** Si desinstalar el sistema, borra esa carpeta y no queda nada.

### Conexiones externas

Por defecto, ME **no hace ninguna llamada a internet**. El sistema funciona completamente offline.

La única excepción es si configuras Ollama con un modelo externo o si el LLM que usas (opencode / Claude Code) hace sus propias llamadas a la API de Anthropic — pero eso es la herramienta de IA que ya estás usando, no ME.

### Código abierto

El código fuente está en GitHub. Puedes auditarlo entero antes de instalarlo.

---

## Verificación — qué debería verse cuando todo funciona

| Qué | Dónde | Cómo se ve |
|-----|-------|-----------|
| Backend corriendo | terminal 1 | `Backend → http://localhost:8082` |
| Frontend corriendo | terminal 2 | `ready - started server on 0.0.0.0:3000` |
| Onboarding | http://localhost:3000 | pantalla de "¿cómo se llama tu agente?" |
| MCP activo | opencode/Claude | tools `abrakadabra`, `save_memory`, etc. disponibles |
| Primera sesión | opencode | escribe `abrakadabra` → el agente se presenta |

---

## Troubleshooting — errores comunes en Windows

### `gcc: command not found` al compilar el MCP
TDM-GCC no está en el PATH. Solución:
1. Reinstala TDM-GCC desde https://jmeubank.github.io/tdm-gcc/
2. Marca "Add to PATH" durante la instalación
3. Cierra **todas** las terminales y abre una nueva
4. Verifica: `gcc --version`

### `go: module not found` al hacer `make setup`
Go no está en el PATH o la instalación no terminó bien. Solución:
1. Reinstala Go desde https://go.dev/dl/
2. Cierra y abre terminal
3. Verifica: `go version`

### El frontend no carga en localhost:3000
El backend no está corriendo o está en otro puerto. Verifica:
1. ¿Está corriendo `make run` o los dos comandos manuales?
2. ¿El backend responde? → `curl http://localhost:8082/api/profile`
3. ¿El `.env` tiene `NEXT_PUBLIC_API_URL=http://localhost:8082`?

### `abrakadabra` no funciona en opencode
El MCP no está configurado. Verifica:
1. ¿Existe `mcp/me-mcp.exe`? → `make build-mcp`
2. ¿El `.mcp.json` tiene las rutas absolutas correctas?
3. ¿El backend está corriendo? (el MCP lo necesita para leer el perfil)

---

*Instalación ME — 2026-04-22*
