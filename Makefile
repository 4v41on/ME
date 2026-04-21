.PHONY: install run build backend frontend clean setup

# ME — Sistema de memoria personal
# Primer uso: make setup && make run

# ─── Cargar .env si existe ───────────────────────────────────────────────────
-include .env
export

# Valores por defecto si .env no existe
ME_PORT             ?= 8082
ME_DB_PATH          ?= ./me.db
OLLAMA_URL          ?= http://localhost:11434
OLLAMA_MODEL        ?= mistral
NEXT_PUBLIC_API_URL ?= http://localhost:$(ME_PORT)

# ─── Tareas ──────────────────────────────────────────────────────────────────

## setup — primera vez: copia .env.example y muestra instrucciones
setup:
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "✓ .env creado desde .env.example"; \
		echo "  Edita .env si necesitas cambiar puertos u Ollama."; \
	else \
		echo "✓ .env ya existe."; \
	fi
	@$(MAKE) install

## install — instala dependencias (Go modules + npm)
install:
	@echo "→ Backend: descargando módulos Go..."
	cd backend && go mod download
	@echo "→ Frontend: instalando dependencias npm..."
	cd frontend && npm install
	@echo "✓ Instalación completa."

## run — levanta backend y frontend en paralelo
run: _print_ports
	@$(MAKE) -j2 _backend _frontend

## build — compila para producción
build: _print_ports
	@echo "→ Compilando backend..."
	cd backend && CGO_CFLAGS="-DSQLITE_ENABLE_FTS5" go build -o me-backend.exe .
	@echo "→ Compilando frontend..."
	cd frontend && NEXT_PUBLIC_API_URL=$(NEXT_PUBLIC_API_URL) npm run build
	@echo "✓ Build completo."

## clean — elimina artefactos de compilación (NO borra la DB)
clean:
	rm -f backend/me-backend backend/me-backend.exe
	rm -rf frontend/.next
	@echo "✓ Limpio."

## clean-db — elimina la base de datos (BORRA TODOS LOS DATOS)
clean-db:
	rm -f backend/me.db backend/me.db-shm backend/me.db-wal
	@echo "✓ Base de datos eliminada."

# ─── Tareas internas ─────────────────────────────────────────────────────────

_backend:
	cd backend && \
	  ME_PORT=$(ME_PORT) \
	  ME_DB_PATH=$(ME_DB_PATH) \
	  OLLAMA_URL=$(OLLAMA_URL) \
	  OLLAMA_MODEL=$(OLLAMA_MODEL) \
	  CGO_CFLAGS="-DSQLITE_ENABLE_FTS5" go run .

_frontend:
	cd frontend && NEXT_PUBLIC_API_URL=$(NEXT_PUBLIC_API_URL) npm run dev

_print_ports:
	@echo "Backend  → http://localhost:$(ME_PORT)"
	@echo "Frontend → http://localhost:3000"
	@echo "Ollama   → $(OLLAMA_URL) ($(OLLAMA_MODEL))"
