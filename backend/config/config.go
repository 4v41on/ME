package config

import (
	"os"
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
// Ollama defaults to localhost:11434 but is treated as optional at runtime.
func Load() *Config {
	return &Config{
		Port:        getEnv("ME_PORT", "8082"),
		DBPath:      getEnv("ME_DB_PATH", "./me.db"),
		VaultPath:   getEnv("ME_VAULT_PATH", "./vault"),
		OllamaURL:   getEnv("OLLAMA_URL", ""),   // empty = disabled
		OllamaModel: getEnv("OLLAMA_MODEL", "mistral"),
	}
}

// OllamaEnabled reports whether Ollama is configured.
func (c *Config) OllamaEnabled() bool {
	return c.OllamaURL != ""
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
