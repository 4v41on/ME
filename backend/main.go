package main

import (
	"fmt"
	"log"
	"net/http"

	"me/backend/config"
	"me/backend/db"
	"me/backend/handlers"
)

func main() {
	cfg := config.Load()

	// Open SQLite (creates file + applies schema on first run)
	database, err := db.Open(cfg.DBPath)
	if err != nil {
		log.Fatalf("failed to open database: %v", err)
	}
	defer database.Close()

	log.Printf("database ready at %s", cfg.DBPath)

	// Wire handlers
	memories := handlers.NewMemoryHandler(database)
	dashboard := handlers.NewDashboardHandler(database)
	chat := handlers.NewChatHandler(database, cfg.OllamaURL, cfg.OllamaModel)
	profile := handlers.NewProfileHandler(database)
	skills := handlers.NewSkillsHandler(database)
	ace := handlers.NewACEHandler(database)

	mux := http.NewServeMux()

	// CORS middleware wraps the entire mux
	handler := corsMiddleware(mux)

	// Memories
	mux.HandleFunc("/api/memories", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			memories.List(w, r)
		case http.MethodPost:
			memories.Create(w, r)
		default:
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	})
	mux.HandleFunc("/api/memories/", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			memories.Get(w, r)
		case http.MethodPut:
			memories.Update(w, r)
		case http.MethodDelete:
			memories.Delete(w, r)
		default:
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// Search
	mux.HandleFunc("/api/search", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		memories.Search(w, r)
	})

	// Dashboard
	mux.HandleFunc("/api/dashboard", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		dashboard.Stats(w, r)
	})

	// Chat (Ollama es opcional — ver /api/chat/status)
	mux.HandleFunc("/api/chat/status", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		chat.Status(w, r)
	})
	mux.HandleFunc("/api/chat", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		chat.Chat(w, r)
	})
	mux.HandleFunc("/api/chat/history", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		chat.History(w, r)
	})

	// Profile / Onboarding
	mux.HandleFunc("/api/profile", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			profile.Get(w, r)
		case http.MethodPost:
			profile.Save(w, r)
		default:
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// Onboarding completo: guarda perfil + genera vault + planta seeds en Šà
	mux.HandleFunc("/api/onboarding/complete", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		profile.CompleteOnboarding(cfg.VaultPath)(w, r)
	})

	// Fase 2 completa: el LLM marca que terminó el onboarding conversacional
	mux.HandleFunc("/api/onboarding/phase2/complete", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		profile.CompletePhase2(w, r)
	})

	// Skills
	mux.HandleFunc("/api/skills", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		skills.List(w, r)
	})
	mux.HandleFunc("/api/skills/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		skills.Execute(w, r)
	})

	// ACE Loop
	mux.HandleFunc("/api/ace", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		ace.Save(w, r)
	})
	mux.HandleFunc("/api/ace/recent", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		ace.Recent(w, r)
	})

	// Health check
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, `{"status":"ok","port":"%s"}`, cfg.Port)
	})

	addr := ":" + cfg.Port
	log.Printf("ME backend listening on %s", addr)
	if err := http.ListenAndServe(addr, handler); err != nil {
		log.Fatalf("server error: %v", err)
	}
}

// corsMiddleware adds CORS headers to allow the Next.js dev server to call the API.
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
