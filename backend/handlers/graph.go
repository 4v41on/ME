package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"
)

// GraphHandler genera el grafo de conexiones entre memorias.
type GraphHandler struct{ db *sql.DB }

func NewGraphHandler(db *sql.DB) *GraphHandler { return &GraphHandler{db: db} }

type GraphNode struct {
	ID       string `json:"id"`
	Label    string `json:"label"`
	Category string `json:"category"`
	Date     string `json:"date"`
}

type GraphLink struct {
	Source string `json:"source"`
	Target string `json:"target"`
	Tag    string `json:"tag"`
}

type GraphData struct {
	Nodes []GraphNode `json:"nodes"`
	Links []GraphLink `json:"links"`
}

// Get — GET /api/memories/graph
// Devuelve nodos (memorias) y links (pares que comparten al menos un tag).
// Limitado a las últimas 200 memorias para no saturar el grafo.
func (h *GraphHandler) Get(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query(`
		SELECT id, category, title, content, tags, created_at
		FROM memories
		ORDER BY created_at DESC
		LIMIT 200
	`)
	if err != nil {
		httpError(w, "db error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type memRow struct {
		id, category, title, content, tags, date string
	}

	var mems []memRow
	for rows.Next() {
		var m memRow
		if err := rows.Scan(&m.id, &m.category, &m.title, &m.content, &m.tags, &m.date); err != nil {
			continue
		}
		mems = append(mems, m)
	}

	// Construir nodos
	nodes := make([]GraphNode, 0, len(mems))
	for _, m := range mems {
		label := m.title
		if label == "" {
			label = m.content
			if len(label) > 40 {
				label = label[:40] + "…"
			}
		}
		date := m.date
		if len(date) >= 10 {
			date = date[:10]
		}
		nodes = append(nodes, GraphNode{
			ID:       m.id,
			Label:    label,
			Category: m.category,
			Date:     date,
		})
	}

	// Construir índice tag → []memoryID
	tagIndex := make(map[string][]string)
	for _, m := range mems {
		if m.tags == "" || m.tags == "null" || m.tags == "[]" {
			continue
		}
		var tags []string
		if err := json.Unmarshal([]byte(m.tags), &tags); err != nil {
			continue
		}
		for _, tag := range tags {
			tag = strings.TrimSpace(strings.ToLower(tag))
			if tag == "" {
				continue
			}
			tagIndex[tag] = append(tagIndex[tag], m.id)
		}
	}

	// Construir links: pares de memorias que comparten un tag
	// Usar set para evitar duplicados
	type edgeKey struct{ a, b string }
	seen := make(map[edgeKey]bool)
	links := make([]GraphLink, 0)

	for tag, ids := range tagIndex {
		if len(ids) < 2 {
			continue
		}
		for i := 0; i < len(ids); i++ {
			for j := i + 1; j < len(ids); j++ {
				a, b := ids[i], ids[j]
				if a > b {
					a, b = b, a
				}
				key := edgeKey{a, b}
				if seen[key] {
					continue
				}
				seen[key] = true
				links = append(links, GraphLink{Source: ids[i], Target: ids[j], Tag: tag})
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(GraphData{Nodes: nodes, Links: links})
}
