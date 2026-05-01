package handlers

import (
	"database/sql"
	"net/http"

	"me/backend/models"
)

// DashboardHandler serves GET /api/dashboard.
type DashboardHandler struct {
	db *sql.DB
}

// NewDashboardHandler returns a DashboardHandler wired to db.
func NewDashboardHandler(db *sql.DB) *DashboardHandler {
	return &DashboardHandler{db: db}
}

// Stats handles GET /api/dashboard.
// Returns total memories, pending tasks, tasks due today, per-category counts, and 10 most recent.
func (h *DashboardHandler) Stats(w http.ResponseWriter, r *http.Request) {
	stats := models.DashboardStats{
		PorCategoria: make(map[string]int),
	}

	// Total memories
	_ = h.db.QueryRow("SELECT COUNT(*) FROM memories").Scan(&stats.TotalMemories)

	// Tareas pendientes: metadata JSON contains "completada": false
	_ = h.db.QueryRow(
		`SELECT COUNT(*) FROM memories
		 WHERE category = 'tarea'
		   AND (metadata IS NULL OR json_extract(metadata, '$.completada') = false OR json_extract(metadata, '$.completada') IS NULL)`,
	).Scan(&stats.TareasPendientes)

	// Tareas con fecha_limite = hoy
	_ = h.db.QueryRow(
		`SELECT COUNT(*) FROM memories
		 WHERE category = 'tarea'
		   AND date(json_extract(metadata, '$.fecha_limite')) = date('now')`,
	).Scan(&stats.TareasHoy)

	// Per-category counts (ORDER BY category for stable output)
	rows, err := h.db.Query("SELECT category, COUNT(*) FROM memories GROUP BY category ORDER BY category")
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var cat string
			var count int
			_ = rows.Scan(&cat, &count)
			stats.PorCategoria[cat] = count
		}
	}

	// 10 most recent memories
	memRows, err := h.db.Query(
		`SELECT id, category, title, content, metadata, tags, created_at, updated_at
		 FROM memories ORDER BY created_at DESC LIMIT 10`,
	)
	if err == nil {
		defer memRows.Close()
		stats.Recientes = scanMemories(memRows)
	}
	if stats.Recientes == nil {
		stats.Recientes = []models.Memory{}
	}

	writeJSON(w, http.StatusOK, stats)
}
