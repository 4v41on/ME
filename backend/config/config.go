package config

import (
	"os"
	"path/filepath"
)

// Config holds all runtime configuration for the ME backend.
type Config struct {
	Port      string
	DBPath    string
	VaultPath string // directorio donde se generan los archivos del vault (CAG)

	// OllamaURL and OllamaModel are OPTIONAL.
	// If OLLAMA_URL is empty or Ollama is unreachable, the chat feature
	// is disabled gracefully — the rest of the system works normally.
	OllamaURL   string
	OllamaModel string
}

// Load reads configuration from environment variables.
// Defaults use ~/.me/ so the DB is always at the same location
// regardless of which directory the server is started from.
func Load() *Config {
	data := dataDir()
	return &Config{
		Port:        getEnv("ME_PORT", "8082"),
		DBPath:      getEnv("ME_DB_PATH", filepath.Join(data, "me.db")),
		VaultPath:   getEnv("ME_VAULT_PATH", filepath.Join(data, "vault")),
		OllamaURL:   getEnv("OLLAMA_URL", ""),
		OllamaModel: getEnv("OLLAMA_MODEL", "mistral"),
	}
}

// OllamaEnabled reports whether Ollama is configured.
func (c *Config) OllamaEnabled() bool {
	return c.OllamaURL != ""
}

// dataDir returns the persistent data directory (~/.me).
// Created on first call if it does not exist.
func dataDir() string {
	home, err := os.UserHomeDir()
	if err != nil {
		home = "."
	}
	dir := filepath.Join(home, ".me")
	_ = os.MkdirAll(dir, 0755)
	return dir
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
