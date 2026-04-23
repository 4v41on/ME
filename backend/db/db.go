package db

import (
	"database/sql"
	"embed"
	"fmt"

	_ "modernc.org/sqlite"
)

//go:embed schema.sql
var schemaFS embed.FS

// Open opens (or creates) the SQLite database at path and runs migrations.
// It enables WAL mode and foreign keys, then applies the embedded schema.
func Open(path string) (*sql.DB, error) {
	// CGO_ENABLED=1 required; go-sqlite3 compiles the C library.
	db, err := sql.Open("sqlite", fmt.Sprintf("file:%s?_pragma=journal_mode(WAL)&_pragma=foreign_keys(ON)", path))
	if err != nil {
		return nil, fmt.Errorf("open db: %w", err)
	}

	// Verify connection
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("ping db: %w", err)
	}

	// Apply schema
	schema, err := schemaFS.ReadFile("schema.sql")
	if err != nil {
		return nil, fmt.Errorf("read schema: %w", err)
	}

	if _, err := db.Exec(string(schema)); err != nil {
		return nil, fmt.Errorf("apply schema: %w", err)
	}

	return db, nil
}
