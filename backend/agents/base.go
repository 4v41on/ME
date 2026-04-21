package agents

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
)

// Agent is a named, configurable actor that can read/write memories.
// The base implementation is intentionally minimal — extend per use case.
type Agent struct {
	ID          string
	Name        string
	Description string
	db          *sql.DB
}

// NewAgent creates and registers a new agent in the system.
//
// Parameters:
//   - db:          active SQLite connection
//   - name:        human-readable agent name
//   - description: what this agent does
func NewAgent(db *sql.DB, name, description string) *Agent {
	return &Agent{
		ID:          uuid.New().String(),
		Name:        name,
		Description: description,
		db:          db,
	}
}

// Remember persists a memory on behalf of this agent.
// Category defaults to "nota" if empty. Tags always include the agent name.
func (a *Agent) Remember(category, title, content string) error {
	if category == "" {
		category = "nota"
	}
	id := uuid.New().String()
	now := time.Now().UTC().Format(time.RFC3339)
	tags := `["agent","` + a.Name + `"]`

	_, err := a.db.Exec(
		`INSERT INTO memories (id, category, title, content, metadata, tags, created_at, updated_at)
		 VALUES (?, ?, ?, ?, '{}', ?, ?, ?)`,
		id, category, title, content, tags, now, now,
	)
	return err
}

// Recall returns the n most recent memories accessible to this agent.
func (a *Agent) Recall(n int) ([]map[string]string, error) {
	rows, err := a.db.Query(
		`SELECT id, category, title, content, created_at FROM memories ORDER BY created_at DESC LIMIT ?`, n,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var memories []map[string]string
	for rows.Next() {
		var id, category, title, content, createdAt string
		rows.Scan(&id, &category, &title, &content, &createdAt)
		memories = append(memories, map[string]string{
			"id":         id,
			"category":   category,
			"title":      title,
			"content":    content,
			"created_at": createdAt,
		})
	}
	return memories, nil
}
