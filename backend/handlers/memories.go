package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"me/backend/models"

	"github.com/google/uuid"
)

// MemoryHandler handles all /api/memories routes.
type MemoryHandler struct {
	db *sql.DB
}

// NewMemoryHandler returns a MemoryHandler wired to db.
func NewMemoryHandler(db *sql.DB) *MemoryHandler {
	return &MemoryHandler{db: db}
}

// Create handles POST /api/memories.
// Validates category, generates UUID, persists to SQLite.
// FTS5 is updated automatically via trigger.
func (h *MemoryHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req models.CreateMemoryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpError(w, "invalid JSON body", http.StatusBadRequest)
		return
	}

	if !models.ValidCategories[req.Category] {
		httpError(w, fmt.Sprintf("invalid category: %s", req.Category), http.StatusBadRequest)
		return
	}

	id := uuid.New().String()
	now := time.Now().UTC().Format(time.RFC3339)

	_, err := h.db.Exec(
		`INSERT INTO memories (id, category, title, content, metadata, tags, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		id, req.Category, req.Title, req.Content, req.Metadata, req.Tags, now, now,
	)
	if err != nil {
		httpError(w, "failed to save memory: "+err.Error(), http.StatusInternalServerError)
		return
	}

	m := models.Memory{
		ID: id, Category: req.Category, Title: req.Title,
		Content: req.Content, CreatedAt: now, UpdatedAt: now,
	}

	// Notificar a clientes SSE
	Bus.Publish(SphereEvent{
		Type:    EventMemorySaved,
		Payload: map[string]string{"id": id, "category": req.Category, "title": req.Title},
	})

	writeJSON(w, http.StatusCreated, m)
}

// List handles GET /api/memories?category=&limit=&offset=
// Returns paginated memories, optionally filtered by category.
func (h *MemoryHandler) List(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	category := q.Get("category")
	limit := intParam(q.Get("limit"), 50)
	offset := intParam(q.Get("offset"), 0)

	var (
		rows *sql.Rows
		err  error
	)

	if category != "" {
		rows, err = h.db.Query(
			`SELECT id, category, title, content, metadata, tags, created_at, updated_at
			 FROM memories WHERE category = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
			category, limit, offset,
		)
	} else {
		rows, err = h.db.Query(
			`SELECT id, category, title, content, metadata, tags, created_at, updated_at
			 FROM memories ORDER BY created_at DESC LIMIT ? OFFSET ?`,
			limit, offset,
		)
	}

	if err != nil {
		httpError(w, "query failed: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	memories := scanMemories(rows)

	// Count total (same filter)
	var total int
	if category != "" {
		_ = h.db.QueryRow("SELECT COUNT(*) FROM memories WHERE category = ?", category).Scan(&total)
	} else {
		_ = h.db.QueryRow("SELECT COUNT(*) FROM memories").Scan(&total)
	}

	writeJSON(w, http.StatusOK, models.MemoryListResponse{Memories: memories, Total: total})
}

// Get handles GET /api/memories/{id}.
func (h *MemoryHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := extractID(r.URL.Path, "/api/memories/")
	if id == "" {
		httpError(w, "missing id", http.StatusBadRequest)
		return
	}

	var m models.Memory
	err := h.db.QueryRow(
		`SELECT id, category, title, content, metadata, tags, created_at, updated_at
		 FROM memories WHERE id = ?`, id,
	).Scan(&m.ID, &m.Category, &m.Title, &m.Content, &m.Metadata, &m.Tags, &m.CreatedAt, &m.UpdatedAt)

	if err == sql.ErrNoRows {
		httpError(w, "memory not found", http.StatusNotFound)
		return
	}
	if err != nil {
		httpError(w, "query failed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, m)
}

// Update handles PUT /api/memories/{id}.
func (h *MemoryHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := extractID(r.URL.Path, "/api/memories/")
	if id == "" {
		httpError(w, "missing id", http.StatusBadRequest)
		return
	}

	var req models.UpdateMemoryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpError(w, "invalid JSON body", http.StatusBadRequest)
		return
	}

	now := time.Now().UTC().Format(time.RFC3339)
	res, err := h.db.Exec(
		`UPDATE memories SET title = ?, content = ?, metadata = ?, tags = ?, updated_at = ?
		 WHERE id = ?`,
		req.Title, req.Content, req.Metadata, req.Tags, now, id,
	)
	if err != nil {
		httpError(w, "update failed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	n, err := res.RowsAffected()
	if err != nil {
		httpError(w, "update verification failed: "+err.Error(), http.StatusInternalServerError)
		return
	}
	if n == 0 {
		httpError(w, "memory not found", http.StatusNotFound)
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"id": id, "updated_at": now})
}

// Delete handles DELETE /api/memories/{id}.
func (h *MemoryHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := extractID(r.URL.Path, "/api/memories/")
	if id == "" {
		httpError(w, "missing id", http.StatusBadRequest)
		return
	}

	res, err := h.db.Exec("DELETE FROM memories WHERE id = ?", id)
	if err != nil {
		httpError(w, "delete failed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	n, err := res.RowsAffected()
	if err != nil {
		httpError(w, "delete verification failed: "+err.Error(), http.StatusInternalServerError)
		return
	}
	if n == 0 {
		httpError(w, "memory not found", http.StatusNotFound)
		return
	}

	Bus.Publish(SphereEvent{Type: EventMemoryDeleted, Payload: map[string]string{"id": id}})
	writeJSON(w, http.StatusOK, map[string]string{"message": "memory deleted"})
}

// Search handles GET /api/search?q=texto
// Uses FTS5 full-text search with BM25 ranking.
func (h *MemoryHandler) Search(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("q")
	if q == "" {
		httpError(w, "missing query parameter 'q'", http.StatusBadRequest)
		return
	}
	if len(q) > 1000 {
		httpError(w, "query too long (max 1000 chars)", http.StatusBadRequest)
		return
	}

	// FTS5 query: strip special chars and boolean operators to prevent injection.
	// We strip both upper and lower variants without changing original case.
	ftsQuery := q
	for _, char := range []string{"\"", "(", ")", "^"} {
		ftsQuery = strings.ReplaceAll(ftsQuery, char, "")
	}
	for _, op := range []string{"AND", "OR", "NOT", "NEAR"} {
		ftsQuery = strings.ReplaceAll(ftsQuery, " "+op+" ", " ")
		ftsQuery = strings.ReplaceAll(ftsQuery, " "+strings.ToLower(op)+" ", " ")
	}
	ftsQuery = strings.TrimSpace(ftsQuery) + "*"

	rows, err := h.db.Query(
		`SELECT m.id, m.category, m.title, m.content, m.metadata, m.tags, m.created_at, m.updated_at
		 FROM memories m
		 JOIN memories_fts fts ON m.rowid = fts.rowid
		 WHERE memories_fts MATCH ?
		 ORDER BY rank
		 LIMIT 20`,
		ftsQuery,
	)
	if err != nil {
		httpError(w, "search failed: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	results := scanMemories(rows)
	Bus.Publish(SphereEvent{Type: EventSearched, Payload: map[string]any{"query": q, "count": len(results)}})
	writeJSON(w, http.StatusOK, models.SearchResponse{Results: results})
}

// --- helpers ---

func scanMemories(rows *sql.Rows) []models.Memory {
	var memories []models.Memory
	for rows.Next() {
		var m models.Memory
		rows.Scan(&m.ID, &m.Category, &m.Title, &m.Content, &m.Metadata, &m.Tags, &m.CreatedAt, &m.UpdatedAt)
		memories = append(memories, m)
	}
	if memories == nil {
		memories = []models.Memory{}
	}
	return memories
}

func extractID(path, prefix string) string {
	return strings.TrimPrefix(path, prefix)
}

func intParam(s string, def int) int {
	if s == "" {
		return def
	}
	v, err := strconv.Atoi(s)
	if err != nil || v <= 0 || v > 1000 {
		return def
	}
	return v
}

func httpError(w http.ResponseWriter, msg string, code int) {
	writeJSON(w, code, map[string]string{"error": msg})
}

func writeJSON(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(v)
}
