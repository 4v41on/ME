# ME

Sistema de memoria personal con IA local. CRUD de memorias, búsqueda full-text, esfera 3D reactiva a música, y chat con LLM.

---

## Requisitos

| Requisito | Obligatorio | Notas |
|-----------|-------------|-------|
| Go 1.21+ | ✅ | Backend |
| Node.js 18+ | ✅ | Frontend |
| gcc / MinGW | ✅ | SQLite CGO |
| Ollama | ❌ opcional | Solo para el chat con LLM |

---

## Instalación

```bash
# 1. Clonar
git clone <repo-url> ME
cd ME

# 2. Crear .env y instalar dependencias
make setup

# 3. Ejecutar
make run
```

Abre [http://localhost:3000](http://localhost:3000).

La primera vez aparece el onboarding — nombras tu IA y respondes 13 preguntas. El sistema usa ese perfil en cada conversación.

---

## Ollama — chat con LLM (opcional)

El chat requiere una máquina capaz de correr modelos locales. **El sistema funciona completo sin Ollama** — memorias, búsqueda, esfera 3D y onboarding no dependen de él.

Si tu máquina lo soporta:

```bash
# Instala Ollama desde https://ollama.ai
# Descarga un modelo
ollama pull mistral

# Activa en tu .env
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=mistral
```

Modelos recomendados según hardware:

| RAM disponible | Modelo |
|---------------|--------|
| 8 GB | `phi3`, `gemma2:2b` |
| 16 GB | `mistral`, `llama3.2` |
| 32 GB+ | `llama3.1:8b`, `qwen2.5:7b` |

Si Ollama no está configurado, el tab Chat muestra una guía de instalación en lugar de un error.

---

## Configuración de puertos

Edita `.env` (creado por `make setup` desde `.env.example`):

```env
ME_PORT=8082                               # backend Go
NEXT_PUBLIC_API_URL=http://localhost:8082  # frontend → backend (debe coincidir con ME_PORT)
```

Si cambias `ME_PORT`, cambia también `NEXT_PUBLIC_API_URL`. El Makefile sincroniza ambos automáticamente al leer `.env`.

---

## Variables de entorno

| Variable | Default | Obligatorio | Descripción |
|----------|---------|-------------|-------------|
| `ME_PORT` | `8082` | ✅ | Puerto del backend |
| `ME_DB_PATH` | `./me.db` | ✅ | Base de datos SQLite |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8082` | ✅ | URL del backend desde el browser |
| `OLLAMA_URL` | vacío | ❌ | URL de Ollama — si vacío, chat deshabilitado |
| `OLLAMA_MODEL` | `mistral` | ❌ | Modelo Ollama a usar |

---

## Comandos

```bash
make setup    # primera vez: crea .env + instala dependencias
make install  # solo instala dependencias
make run      # backend + frontend en paralelo
make build    # compila para producción
make clean    # elimina artefactos (no toca la DB)
make clean-db # elimina la base de datos (BORRA DATOS)
```

---

## Estructura

```
ME/
├── .env.example   ← plantilla de configuración (se commitea)
├── .env           ← tu configuración local (NO se commitea)
├── Makefile
├── README.md
├── backend/       ← Go 1.21+, SQLite+FTS5, REST API
├── frontend/      ← Next.js 16, Tailwind, React Three Fiber
└── docs/          ← documentación técnica
```

---

## Documentación

- [docs/API.md](docs/API.md) — todos los endpoints con curl
- [docs/EVASPHERE.md](docs/EVASPHERE.md) — shaders Perlin 4D, cómo agregar música
- [docs/ONBOARDING.md](docs/ONBOARDING.md) — flujo de las 13 preguntas
