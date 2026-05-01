package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"github.com/google/uuid"
)

// ACEHandler implements the ACE Loop (Auto-Context Engine).
// It saves relevant context snippets to Šà automatically.
type ACEHandler struct {
	db *sql.DB
}

// NewACEHandler returns an ACEHandler wired to db.
func NewACEHandler(db *sql.DB) *ACEHandler {
	return &ACEHandler{db: db}
}

// Save handles POST /api/ace.
// Accepts a context snippet and persists it to memories (category: nota, tag: ace).
// The frontend calls this after significant interactions to preserve context.
//
// Request body:
//
//	{ "content": "string", "title": "string (optional)" }
func (h *ACEHandler) Save(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Content string `json:"content"`
		Title   string `json:"title"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Content == "" {
		httpError(w, "field 'content' is required", http.StatusBadRequest)
		return
	}

	// Quality gate: reject very short or generic content
	if len(req.Content) < 20 {
		httpError(w, "content too short to be worth persisting (< 20 chars)", http.StatusBadRequest)
		return
	}

	id := uuid.New().String()
	now := time.Now().UTC().Format(time.RFC3339)
	title := req.Title
	if title == "" {
		// Auto-title from first 60 chars
		title = req.Content
		if len(title) > 60 {
			title = title[:60] + "..."
		}
	}

	_, err := h.db.Exec(
		`INSERT INTO memories (id, category, title, content, metadata, tags, created_at, updated_at)
		 VALUES (?, 'nota', ?, ?, '{}', '["ace","auto"]', ?, ?)`,
		id, title, req.Content, now, now,
	)
	if err != nil {
		httpError(w, "failed to save: "+err.Error(), http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusCreated, map[string]string{
		"id":         id,
		"saved_at":   now,
	})
}

// Recent handles GET /api/ace/recent.
// Returns the 5 most recent ACE-saved context snippets.
func (h *ACEHandler) Recent(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query(
		`SELECT id, category, title, content, metadata, tags, created_at, updated_at
		 FROM memories
		 WHERE category = 'nota'
		   AND (json_extract(tags, '$[0]') = 'ace' OR json_extract(tags, '$[1]') = 'ace')
		 ORDER BY created_at DESC LIMIT 5`,
	)
	if err != nil {
		httpError(w, "query failed: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	writeJSON(w, http.StatusOK, map[string]any{
		"recent": scanMemories(rows),
	})
}
