package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"github.com/google/uuid"
)

// SkillsHandler handles /api/skills routes.
// Skills are named HTTP actions the system can execute on demand.
type SkillsHandler struct {
	db *sql.DB
}

// NewSkillsHandler returns a SkillsHandler wired to db.
func NewSkillsHandler(db *sql.DB) *SkillsHandler {
	h := &SkillsHandler{db: db}
	h.seedDefaultSkills()
	return h
}

// List handles GET /api/skills.
// Returns all registered skills.
func (h *SkillsHandler) List(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query("SELECT id, name, description, endpoint, created_at FROM skills ORDER BY name")
	if err != nil {
		httpError(w, "query failed: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type Skill struct {
		ID          string `json:"id"`
		Name        string `json:"name"`
		Description string `json:"description"`
		Endpoint    string `json:"endpoint"`
		CreatedAt   string `json:"created_at"`
	}

	skills := []Skill{}
	for rows.Next() {
		var s Skill
		rows.Scan(&s.ID, &s.Name, &s.Description, &s.Endpoint, &s.CreatedAt)
		skills = append(skills, s)
	}

	writeJSON(w, http.StatusOK, map[string]any{"skills": skills})
}

// Execute handles POST /api/skills/{name}.
// Dispatches to the named internal skill handler.
func (h *SkillsHandler) Execute(w http.ResponseWriter, r *http.Request) {
	name := extractID(r.URL.Path, "/api/skills/")
	if name == "" {
		httpError(w, "missing skill name", http.StatusBadRequest)
		return
	}

	var params map[string]any
	if r.ContentLength > 0 {
		if err := json.NewDecoder(r.Body).Decode(&params); err != nil {
			httpError(w, "invalid JSON body: "+err.Error(), http.StatusBadRequest)
			return
		}
	}

	switch name {
	case "daily-summary":
		h.skillDailySummary(w, r)
	case "clear-completed-tasks":
		h.skillClearCompleted(w, r)
	default:
		httpError(w, "skill not found: "+name, http.StatusNotFound)
	}
}

// skillDailySummary returns counts of memories created today grouped by category.
func (h *SkillsHandler) skillDailySummary(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query(
		`SELECT category, COUNT(*) FROM memories
		 WHERE date(created_at) = date('now')
		 GROUP BY category`,
	)
	if err != nil {
		httpError(w, "query failed: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	summary := map[string]int{}
	for rows.Next() {
		var cat string
		var count int
		rows.Scan(&cat, &count)
		summary[cat] = count
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"skill":   "daily-summary",
		"summary": summary,
		"date":    time.Now().UTC().Format("2006-01-02"),
	})
}

// skillClearCompleted marks all completed tasks as deleted (soft delete via metadata flag).
func (h *SkillsHandler) skillClearCompleted(w http.ResponseWriter, r *http.Request) {
	res, err := h.db.Exec(
		`DELETE FROM memories
		 WHERE category = 'tarea'
		   AND json_extract(metadata, '$.completada') = true`,
	)
	if err != nil {
		httpError(w, "failed: "+err.Error(), http.StatusInternalServerError)
		return
	}
	n, err := res.RowsAffected()
	if err != nil {
		httpError(w, "failed to count deleted: "+err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"skill":   "clear-completed-tasks",
		"deleted": n,
	})
}

// seedDefaultSkills inserts the built-in skills if they don't exist yet.
func (h *SkillsHandler) seedDefaultSkills() {
	defaults := []struct{ name, desc, endpoint string }{
		{"daily-summary", "Resumen de memorias creadas hoy por categoría", "/api/skills/daily-summary"},
		{"clear-completed-tasks", "Elimina todas las tareas marcadas como completadas", "/api/skills/clear-completed-tasks"},
	}
	now := time.Now().UTC().Format(time.RFC3339)
	for _, s := range defaults {
		h.db.Exec(
			`INSERT OR IGNORE INTO skills (id, name, description, endpoint, created_at)
			 VALUES (?, ?, ?, ?, ?)`,
			uuid.New().String(), s.name, s.desc, s.endpoint, now,
		)
	}
}
