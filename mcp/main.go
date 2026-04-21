// me-mcp — Servidor MCP para ME / Šà
//
// Protocolo: JSON-RPC 2.0 sobre stdio.
// Opencode y Claude Code se conectan a este binario y pueden leer/escribir
// memorias en Šà directamente desde la conversación.
//
// Uso en .mcp.json / claude_desktop_config.json:
//
//	{
//	  "mcpServers": {
//	    "me": {
//	      "command": "D:/Users/.../ME/mcp/me-mcp.exe",
//	      "args": [],
//	      "env": {
//	        "ME_DB_PATH":   "D:/Users/.../ME/backend/me.db",
//	        "ME_INIT_PATH": "D:/Users/.../ME/ME-Init.md"
//	      }
//	    }
//	  }
//	}
//
// Al inicio de cada sesión llama read_init para cargar el contexto del sistema.

package main

import (
	"bufio"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	_ "github.com/mattn/go-sqlite3"
	"github.com/google/uuid"
	"io"
)

// ─── JSON-RPC types ──────────────────────────────────────────────────────────

type Request struct {
	JSONRPC string          `json:"jsonrpc"`
	ID      any             `json:"id"`
	Method  string          `json:"method"`
	Params  json.RawMessage `json:"params"`
}

type Response struct {
	JSONRPC string `json:"jsonrpc"`
	ID      any    `json:"id"`
	Result  any    `json:"result,omitempty"`
	Error   *RPCError `json:"error,omitempty"`
}

type RPCError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

// ─── MCP types ───────────────────────────────────────────────────────────────

type Tool struct {
	Name        string      `json:"name"`
	Description string      `json:"description"`
	InputSchema InputSchema `json:"inputSchema"`
}

type InputSchema struct {
	Type       string              `json:"type"`
	Properties map[string]Property `json:"properties"`
	Required   []string            `json:"required,omitempty"`
}

type Property struct {
	Type        string   `json:"type"`
	Description string   `json:"description"`
	Enum        []string `json:"enum,omitempty"`
}

type TextContent struct {
	Type string `json:"type"`
	Text string `json:"text"`
}

// ─── Tools definition ────────────────────────────────────────────────────────

var tools = []Tool{
	{
		Name:        "save_memory",
		Description: "Guarda una nueva memoria en Šà. Úsala para persistir información relevante de la conversación: decisiones, contexto, tareas, notas.",
		InputSchema: InputSchema{
			Type: "object",
			Properties: map[string]Property{
				"category": {
					Type:        "string",
					Description: "Categoría de la memoria",
					Enum:        []string{"tarea", "nota", "recordatorio", "estado_animo", "reflexion", "logro", "aprendizaje", "pregunta", "perfil"},
				},
				"title":   {Type: "string", Description: "Título breve (opcional)"},
				"content": {Type: "string", Description: "Contenido de la memoria"},
				"tags":    {Type: "string", Description: `JSON array de tags, e.g. ["trabajo","importante"]`},
			},
			Required: []string{"category", "content"},
		},
	},
	{
		Name:        "search_memory",
		Description: "Busca en Šà usando full-text search (FTS5 BM25). Úsala para recuperar contexto relevante antes de responder.",
		InputSchema: InputSchema{
			Type: "object",
			Properties: map[string]Property{
				"query": {Type: "string", Description: "Texto a buscar"},
			},
			Required: []string{"query"},
		},
	},
	{
		Name:        "list_memories",
		Description: "Lista las memorias más recientes, opcionalmente filtradas por categoría.",
		InputSchema: InputSchema{
			Type: "object",
			Properties: map[string]Property{
				"category": {Type: "string", Description: "Filtrar por categoría (opcional)"},
				"limit":    {Type: "string", Description: "Número de resultados, default 20"},
			},
		},
	},
	{
		Name:        "get_stats",
		Description: "Retorna estadísticas del sistema: total de memorias, tareas pendientes, distribución por categoría.",
		InputSchema: InputSchema{
			Type:       "object",
			Properties: map[string]Property{},
		},
	},
	{
		Name:        "get_profile",
		Description: "Retorna el perfil del usuario construido durante el onboarding: nombre de la IA, trabajo, metas, estilo de comunicación.",
		InputSchema: InputSchema{
			Type:       "object",
			Properties: map[string]Property{},
		},
	},
	{
		Name:        "read_init",
		Description: "Lee el archivo ME-Init.md y retorna su contenido completo. Llama esta herramienta al inicio de cada sesión para cargar el contexto del sistema: quién eres, qué existe, y cómo operar.",
		InputSchema: InputSchema{
			Type:       "object",
			Properties: map[string]Property{},
		},
	},
	{
		Name:        "abrakadabra",
		Description: "Palabra mágica de activación. Cuando el usuario escriba 'abrakadabra', llama esta herramienta — carga el contexto completo del sistema: ME-Init.md + perfil del usuario + perfil del agente. Si la Fase 2 del onboarding está pendiente, retorna instrucciones para iniciarla.",
		InputSchema: InputSchema{
			Type:       "object",
			Properties: map[string]Property{},
		},
	},
	{
		Name:        "complete_phase2",
		Description: "Marca la Fase 2 del onboarding conversacional como completada. Llama esta herramienta al terminar el onboarding conversacional con el usuario.",
		InputSchema: InputSchema{
			Type:       "object",
			Properties: map[string]Property{},
		},
	},
	{
		Name:        "update_vault",
		Description: "Actualiza un archivo del vault (CAG). Úsalo cuando aprendas algo significativo sobre el usuario o cuando la personalidad del agente evolucione. Archivos disponibles: AGENT-IDENTITY.md, USER-PROFILE.md, HOW-TO-TALK.md.",
		InputSchema: InputSchema{
			Type: "object",
			Properties: map[string]Property{
				"file": {
					Type:        "string",
					Description: "Nombre del archivo a actualizar",
					Enum:        []string{"AGENT-IDENTITY.md", "USER-PROFILE.md", "HOW-TO-TALK.md"},
				},
				"content": {
					Type:        "string",
					Description: "Contenido completo del archivo (reemplaza el existente)",
				},
			},
			Required: []string{"file", "content"},
		},
	},
}

// ─── Main ─────────────────────────────────────────────────────────────────────

var initPath string
var vaultPath string

func main() {
	dbPath := os.Getenv("ME_DB_PATH")
	if dbPath == "" {
		dbPath = "./me.db"
	}

	initPath = os.Getenv("ME_INIT_PATH")
	if initPath == "" {
		initPath = "./ME-Init.md"
	}

	vaultPath = os.Getenv("ME_VAULT_PATH")
	if vaultPath == "" {
		vaultPath = "./vault"
	}

	db, err := openDB(dbPath)
	if err != nil {
		log.Fatalf("me-mcp: cannot open db at %s: %v", dbPath, err)
	}
	defer db.Close()

	log.SetOutput(os.Stderr) // MCP uses stdout for JSON-RPC, stderr for logs
	log.Printf("me-mcp ready (db: %s)", dbPath)

	scanner := bufio.NewScanner(os.Stdin)
	scanner.Buffer(make([]byte, 1024*1024), 1024*1024)

	for scanner.Scan() {
		line := scanner.Text()
		if strings.TrimSpace(line) == "" {
			continue
		}

		var req Request
		if err := json.Unmarshal([]byte(line), &req); err != nil {
			writeError(nil, -32700, "parse error")
			continue
		}

		handle(db, req)
	}
}

// ─── Handler ─────────────────────────────────────────────────────────────────

func handle(db *sql.DB, req Request) {
	switch req.Method {

	case "initialize":
		writeResult(req.ID, map[string]any{
			"protocolVersion": "2024-11-05",
			"capabilities":    map[string]any{"tools": map[string]any{}},
			"serverInfo":      map[string]any{"name": "me-mcp", "version": "1.0.0"},
		})

	case "tools/list":
		writeResult(req.ID, map[string]any{"tools": tools})

	case "tools/call":
		var p struct {
			Name      string          `json:"name"`
			Arguments json.RawMessage `json:"arguments"`
		}
		if err := json.Unmarshal(req.Params, &p); err != nil {
			writeError(req.ID, -32602, "invalid params")
			return
		}
		callTool(db, req.ID, p.Name, p.Arguments)

	case "notifications/initialized":
		// No response needed for notifications

	default:
		writeError(req.ID, -32601, "method not found: "+req.Method)
	}
}

// ─── Tool dispatch ────────────────────────────────────────────────────────────

func callTool(db *sql.DB, id any, name string, args json.RawMessage) {
	switch name {

	case "save_memory":
		var a struct {
			Category string `json:"category"`
			Title    string `json:"title"`
			Content  string `json:"content"`
			Tags     string `json:"tags"`
		}
		json.Unmarshal(args, &a)
		if a.Content == "" {
			toolError(id, "content is required")
			return
		}
		mid := uuid.New().String()
		now := time.Now().UTC().Format(time.RFC3339)
		_, err := db.Exec(
			`INSERT INTO memories (id, category, title, content, metadata, tags, created_at, updated_at)
			 VALUES (?, ?, ?, ?, '{}', ?, ?, ?)`,
			mid, a.Category, a.Title, a.Content, a.Tags, now, now,
		)
		if err != nil {
			toolError(id, "db error: "+err.Error())
			return
		}
		toolText(id, fmt.Sprintf("Memoria guardada (id: %s, categoría: %s)", mid, a.Category))

	case "search_memory":
		var a struct{ Query string `json:"query"` }
		json.Unmarshal(args, &a)
		if a.Query == "" {
			toolError(id, "query is required")
			return
		}
		ftsQuery := strings.ReplaceAll(a.Query, `"`, "") + "*"
		rows, err := db.Query(
			`SELECT m.category, m.title, m.content, m.created_at
			 FROM memories m
			 JOIN memories_fts fts ON m.rowid = fts.rowid
			 WHERE memories_fts MATCH ?
			 ORDER BY rank LIMIT 10`,
			ftsQuery,
		)
		if err != nil {
			toolError(id, "search error: "+err.Error())
			return
		}
		defer rows.Close()
		var sb strings.Builder
		count := 0
		for rows.Next() {
			var cat, title, content, createdAt string
			rows.Scan(&cat, &title, &content, &createdAt)
			if title != "" {
				fmt.Fprintf(&sb, "[%s] %s — %s\n%s\n\n", cat, title, createdAt[:10], content)
			} else {
				fmt.Fprintf(&sb, "[%s] %s\n%s\n\n", cat, createdAt[:10], content)
			}
			count++
		}
		if count == 0 {
			toolText(id, "Sin resultados para: "+a.Query)
		} else {
			toolText(id, fmt.Sprintf("%d resultado(s):\n\n%s", count, sb.String()))
		}

	case "list_memories":
		var a struct {
			Category string `json:"category"`
			Limit    string `json:"limit"`
		}
		json.Unmarshal(args, &a)
		limit := 20
		if a.Limit == "10" { limit = 10 } else if a.Limit == "50" { limit = 50 }

		var rows *sql.Rows
		var err error
		if a.Category != "" {
			rows, err = db.Query(
				`SELECT category, title, content, created_at FROM memories
				 WHERE category = ? ORDER BY created_at DESC LIMIT ?`,
				a.Category, limit,
			)
		} else {
			rows, err = db.Query(
				`SELECT category, title, content, created_at FROM memories
				 ORDER BY created_at DESC LIMIT ?`,
				limit,
			)
		}
		if err != nil {
			toolError(id, "db error: "+err.Error())
			return
		}
		defer rows.Close()
		var sb strings.Builder
		count := 0
		for rows.Next() {
			var cat, title, content, createdAt string
			rows.Scan(&cat, &title, &content, &createdAt)
			if title != "" {
				fmt.Fprintf(&sb, "[%s] %s — %s\n", cat, title, createdAt[:10])
			} else {
				preview := content
				if len(preview) > 80 { preview = preview[:80] + "..." }
				fmt.Fprintf(&sb, "[%s] %s — %s\n", cat, preview, createdAt[:10])
			}
			count++
		}
		if count == 0 {
			toolText(id, "Sin memorias.")
		} else {
			toolText(id, fmt.Sprintf("%d memorias:\n\n%s", count, sb.String()))
		}

	case "get_stats":
		var total, pendientes int
		db.QueryRow("SELECT COUNT(*) FROM memories").Scan(&total)
		db.QueryRow(
			`SELECT COUNT(*) FROM memories WHERE category='tarea'
			 AND (json_extract(metadata,'$.completada')=false OR json_extract(metadata,'$.completada') IS NULL)`,
		).Scan(&pendientes)

		rows, _ := db.Query("SELECT category, COUNT(*) FROM memories GROUP BY category ORDER BY COUNT(*) DESC")
		var sb strings.Builder
		if rows != nil {
			defer rows.Close()
			for rows.Next() {
				var cat string; var n int
				rows.Scan(&cat, &n)
				fmt.Fprintf(&sb, "  %s: %d\n", cat, n)
			}
		}
		toolText(id, fmt.Sprintf(
			"Total memorias: %d\nTareas pendientes: %d\n\nPor categoría:\n%s",
			total, pendientes, sb.String(),
		))

	case "get_profile":
		rows, err := db.Query("SELECT key, value FROM profile ORDER BY key")
		if err != nil {
			toolError(id, "db error: "+err.Error())
			return
		}
		defer rows.Close()
		var sb strings.Builder
		count := 0
		for rows.Next() {
			var k, v string
			rows.Scan(&k, &v)
			fmt.Fprintf(&sb, "%s: %s\n", k, v)
			count++
		}
		if count == 0 {
			toolText(id, "Perfil vacío — onboarding no completado.")
		} else {
			toolText(id, sb.String())
		}

	case "read_init":
		f, err := os.Open(initPath)
		if err != nil {
			toolError(id, fmt.Sprintf("no se pudo leer ME-Init.md en %s: %v", initPath, err))
			return
		}
		defer f.Close()
		data, err := io.ReadAll(f)
		if err != nil {
			toolError(id, "error leyendo ME-Init.md: "+err.Error())
			return
		}
		toolText(id, string(data))

	case "abrakadabra":
		// 1. Lee ME-Init.md
		initData, err := os.ReadFile(initPath)
		if err != nil {
			toolError(id, fmt.Sprintf("no se pudo leer ME-Init.md en %s: %v", initPath, err))
			return
		}

		// 2. Lee perfil de SQLite
		rows, err := db.Query("SELECT key, value FROM profile ORDER BY key")
		if err != nil {
			toolError(id, "error leyendo perfil: "+err.Error())
			return
		}
		defer rows.Close()

		profile := make(map[string]string)
		for rows.Next() {
			var k, v string
			rows.Scan(&k, &v)
			profile[k] = v
		}

		// 3. Lee archivos del vault si existen
		var vaultContext strings.Builder
		for _, fname := range []string{"AGENT-IDENTITY.md", "USER-PROFILE.md", "HOW-TO-TALK.md"} {
			fpath := vaultPath + "/" + fname
			content, err := os.ReadFile(fpath)
			if err == nil {
				fmt.Fprintf(&vaultContext, "\n\n---\n## %s\n\n%s", fname, string(content))
			}
		}

		// 4. Detecta si Fase 2 está pendiente
		phase1 := profile["phase1_complete"] == "true"
		phase2 := profile["phase2_complete"] == "true"

		var sb strings.Builder
		fmt.Fprintf(&sb, "%s", string(initData))

		if vaultContext.Len() > 0 {
			fmt.Fprintf(&sb, "\n\n---\n# Vault (CAG)%s", vaultContext.String())
		}

		if phase1 && !phase2 {
			aiName := profile["ai_name"]
			archetype := profile["archetype"]
			fmt.Fprintf(&sb, `

---
# ⚠️ FASE 2 PENDIENTE — Onboarding conversacional

El usuario completó el onboarding visual (Fase 1) pero aún no ha tenido
el primer onboarding conversacional contigo.

**Agente:** %s
**Arquetipo:** %s

## Qué debes hacer ahora

1. Preséntate como %s, con la voz del arquetipo %s
2. Dile al usuario que ya conoces su perfil base (lo leíste del vault)
3. Profundiza en lo que el formulario no puede capturar:
   - ¿Qué no dijo en las respuestas? ¿Qué simplificó?
   - ¿Qué hay detrás del obstáculo que mencionó?
   - ¿Cuál es la versión real de sus metas vs. la versión "correcta" que escribió?
4. Al terminar:
   - Reescribe USER-PROFILE.md con lo que aprendiste (usa update_vault)
   - Reescribe AGENT-IDENTITY.md si tu voz evolucionó (usa update_vault)
   - Llama complete_phase2 para marcar el onboarding como completo

Este onboarding ocurre UNA SOLA VEZ. Después, abrakadabra solo carga contexto.
`, aiName, archetype, aiName, archetype)
		}

		toolText(id, sb.String())

	case "complete_phase2":
		now := time.Now().UTC().Format(time.RFC3339)
		_, err := db.Exec(
			`INSERT INTO profile (key, value, updated_at) VALUES ('phase2_complete', 'true', ?)
			 ON CONFLICT(key) DO UPDATE SET value = 'true', updated_at = excluded.updated_at`,
			now,
		)
		if err != nil {
			toolError(id, "db error: "+err.Error())
			return
		}
		toolText(id, "Fase 2 completada. El onboarding conversacional está cerrado — abrakadabra solo cargará contexto desde ahora.")

	case "update_vault":
		var a struct {
			File    string `json:"file"`
			Content string `json:"content"`
		}
		json.Unmarshal(args, &a)
		if a.File == "" || a.Content == "" {
			toolError(id, "file y content son requeridos")
			return
		}
		// Solo permite los tres archivos del vault
		allowed := map[string]bool{
			"AGENT-IDENTITY.md": true,
			"USER-PROFILE.md":   true,
			"HOW-TO-TALK.md":    true,
		}
		if !allowed[a.File] {
			toolError(id, "archivo no permitido: "+a.File)
			return
		}
		fpath := vaultPath + "/" + a.File
		if err := os.MkdirAll(vaultPath, 0755); err != nil {
			toolError(id, "no se pudo crear el directorio vault: "+err.Error())
			return
		}
		if err := os.WriteFile(fpath, []byte(a.Content), 0644); err != nil {
			toolError(id, "error escribiendo "+a.File+": "+err.Error())
			return
		}
		toolText(id, fmt.Sprintf("%s actualizado en %s", a.File, fpath))

	default:
		writeError(id, -32601, "tool not found: "+name)
	}
}

// ─── Response helpers ─────────────────────────────────────────────────────────

func toolText(id any, text string) {
	writeResult(id, map[string]any{
		"content": []TextContent{{Type: "text", Text: text}},
	})
}

func toolError(id any, msg string) {
	writeResult(id, map[string]any{
		"content":  []TextContent{{Type: "text", Text: "Error: " + msg}},
		"isError":  true,
	})
}

func writeResult(id any, result any) {
	write(Response{JSONRPC: "2.0", ID: id, Result: result})
}

func writeError(id any, code int, msg string) {
	write(Response{JSONRPC: "2.0", ID: id, Error: &RPCError{Code: code, Message: msg}})
}

func write(r Response) {
	b, _ := json.Marshal(r)
	fmt.Println(string(b))
}

// ─── DB ───────────────────────────────────────────────────────────────────────

func openDB(path string) (*sql.DB, error) {
	db, err := sql.Open("sqlite3", path+"?_journal=WAL&_foreign_keys=on")
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("db unreachable at %s: %w", path, err)
	}
	return db, nil
}
