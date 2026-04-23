.PHONY: install run build build-mcp backend frontend clean setup check-go

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

## check-deps — verifica que Go, Node.js y gcc estén instalados
check-go:
	@MISSING=""; \
	if ! command -v go > /dev/null 2>&1; then MISSING="$$MISSING go"; fi; \
	if ! command -v node > /dev/null 2>&1; then MISSING="$$MISSING node"; fi; \
	if ! command -v npm > /dev/null 2>&1; then MISSING="$$MISSING npm"; fi; \
	if ! command -v gcc > /dev/null 2>&1; then MISSING="$$MISSING gcc"; fi; \
	if [ -n "$$MISSING" ]; then \
		echo ""; \
		echo "✗ Faltan dependencias:$$MISSING"; \
		echo ""; \
		echo "  ── Go (backend + MCP) ──────────────────────────────────"; \
		echo "  https://go.dev/dl/"; \
		echo "  Windows: descarga el instalador .msi y ejecutalo"; \
		echo "  Verifica: go version"; \
		echo ""; \
		echo "  ── Node.js + npm (frontend) ────────────────────────────"; \
		echo "  https://nodejs.org/  (descarga la versión LTS)"; \
		echo "  Windows: descarga el instalador .msi y ejecutalo"; \
		echo "  Verifica: node --version && npm --version"; \
		echo ""; \
		echo "  ── gcc / MinGW (requerido por SQLite en Go) ────────────"; \
		echo "  Windows: instala TDM-GCC desde https://jmeubank.github.io/tdm-gcc/"; \
		echo "  O MinGW-w64 desde https://www.mingw-w64.org/"; \
		echo "  Verifica: gcc --version"; \
		echo ""; \
		echo "  Después de instalar, cierra y abre la terminal."; \
		echo ""; \
		exit 1; \
	else \
		echo "✓ Go $(shell go version | awk '{print $$3}') — Node $(shell node --version) — gcc OK"; \
	fi

## setup — primera vez: verifica Go, copia .env.example, instala dependencias
setup: check-go
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "✓ .env creado desde .env.example"; \
		echo "  Edita .env si necesitas cambiar puertos u Ollama."; \
	else \
		echo "✓ .env ya existe."; \
	fi
	@$(MAKE) install
	@echo ""
	@echo "─────────────────────────────────────────"
	@echo "Siguiente paso: compila el servidor MCP"
	@echo "  make build-mcp"
	@echo "─────────────────────────────────────────"

## install — instala dependencias (Go modules + npm)
install: check-go
	@echo "→ Backend: descargando módulos Go..."
	cd backend && go mod download
	@echo "→ MCP: descargando módulos Go..."
	cd mcp && go mod download
	@echo "→ Frontend: instalando dependencias npm..."
	cd frontend && npm install
	@echo "✓ Instalación completa."

## build-mcp — compila el servidor MCP (me-mcp.exe)
## Necesario una vez antes de conectar opencode/Claude al sistema.
build-mcp: check-go
	@echo "→ Compilando me-mcp.exe..."
	cd mcp && go build -o me-mcp.exe .
	@echo "✓ mcp/me-mcp.exe listo."
	@echo ""
	@echo "  Configura tu cliente MCP apuntando a:"
	@echo "  $(CURDIR)/mcp/me-mcp.exe"
	@echo ""
	@echo "  Variables de entorno requeridas:"
	@echo "    ME_DB_PATH   = $(CURDIR)/backend/me.db"
	@echo "    ME_VAULT_PATH= $(CURDIR)/vault"
	@echo "    ME_INIT_PATH = $(CURDIR)/ME-Init.md"

## run — levanta backend y frontend en paralelo
run: _print_ports
	@$(MAKE) -j2 _backend _frontend

## build — compila backend + MCP para producción
build: check-go _print_ports
	@echo "→ Compilando backend..."
	cd backend && go build -o me-backend.exe .
	@echo "→ Compilando MCP..."
	cd mcp && go build -o me-mcp.exe .
	@echo "→ Compilando frontend..."
	cd frontend && NEXT_PUBLIC_API_URL=$(NEXT_PUBLIC_API_URL) npm run build
	@echo "✓ Build completo."

## clean — elimina artefactos de compilación (NO borra la DB)
clean:
	rm -f backend/me-backend backend/me-backend.exe
	rm -f mcp/me-mcp mcp/me-mcp.exe
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
	  go run .

_frontend:
	cd frontend && NEXT_PUBLIC_API_URL=$(NEXT_PUBLIC_API_URL) npm run dev

_print_ports:
	@echo "Backend  → http://localhost:$(ME_PORT)"
	@echo "Frontend → http://localhost:3000"
	@echo "Ollama   → $(OLLAMA_URL) ($(OLLAMA_MODEL))"
