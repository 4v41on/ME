package handlers

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"me/backend/models"

	"github.com/google/uuid"
)

// ChatHandler handles POST /api/chat, GET /api/chat/history, GET /api/chat/status.
type ChatHandler struct {
	db          *sql.DB
	ollamaURL   string
	ollamaModel string
	// enabled is false when OLLAMA_URL is not set — chat is disabled gracefully.
	enabled bool
}

// NewChatHandler returns a ChatHandler.
// If ollamaURL is empty, chat is disabled but all other endpoints still work.
func NewChatHandler(db *sql.DB, ollamaURL, ollamaModel string) *ChatHandler {
	return &ChatHandler{
		db:          db,
		ollamaURL:   ollamaURL,
		ollamaModel: ollamaModel,
		enabled:     ollamaURL != "",
	}
}

// ollamaMessage mirrors the Ollama /api/chat message format.
type ollamaMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// ollamaChatRequest is the payload sent to Ollama.
type ollamaChatRequest struct {
	Model    string          `json:"model"`
	Messages []ollamaMessage `json:"messages"`
	Stream   bool            `json:"stream"`
}

// ollamaChatResponse is the response from Ollama (stream=false).
type ollamaChatResponse struct {
	Message ollamaMessage `json:"message"`
}

// Status handles GET /api/chat/status.
// Returns whether Ollama is configured and reachable.
// The frontend uses this to show or hide the chat feature.
func (h *ChatHandler) Status(w http.ResponseWriter, r *http.Request) {
	if !h.enabled {
		writeJSON(w, http.StatusOK, map[string]any{
			"enabled":   false,
			"reason":    "OLLAMA_URL no configurado en .env",
			"model":     "",
			"reachable": false,
		})
		return
	}

	// Probe Ollama with a lightweight request
	reachable := h.probeOllama()
	writeJSON(w, http.StatusOK, map[string]any{
		"enabled":   true,
		"model":     h.ollamaModel,
		"reachable": reachable,
		"url":       h.ollamaURL,
	})
}

// Chat handles POST /api/chat.
// If Ollama is not configured or unreachable, returns a clear 503 with instructions
// instead of a generic 500 — the dashboard stays fully functional.
func (h *ChatHandler) Chat(w http.ResponseWriter, r *http.Request) {
	if !h.enabled {
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{
			"error": "Chat no disponible. Configura OLLAMA_URL en .env y reinicia.",
			"docs":  "https://ollama.ai — instala Ollama y agrega OLLAMA_URL=http://localhost:11434 a tu .env",
		})
		return
	}

	var req struct {
		Message string `json:"message"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.Message) == "" {
		httpError(w, "field 'message' is required", http.StatusBadRequest)
		return
	}

	systemPrompt := h.buildSystemPrompt()
	history := h.loadHistory(20)

	messages := make([]ollamaMessage, 0, len(history)+2)
	messages = append(messages, ollamaMessage{Role: "system", Content: systemPrompt})
	for _, m := range history {
		messages = append(messages, ollamaMessage{Role: m.Role, Content: m.Content})
	}
	messages = append(messages, ollamaMessage{Role: "user", Content: req.Message})

	reply, err := h.callOllama(messages)
	if err != nil {
		// Ollama configured but unreachable — clear message, not a 500
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{
			"error": "Ollama no responde. ¿Está corriendo? Verifica con: ollama list",
		})
		return
	}

	now := time.Now().UTC().Format(time.RFC3339)

	if _, err := h.db.Exec(
		"INSERT INTO chat_history (id, role, content, created_at) VALUES (?, ?, ?, ?)",
		uuid.New().String(), "user", req.Message, now,
	); err != nil {
		log.Printf("warning: failed to save user message to chat_history: %v", err)
	}
	if _, err := h.db.Exec(
		"INSERT INTO chat_history (id, role, content, created_at) VALUES (?, ?, ?, ?)",
		uuid.New().String(), "assistant", reply, now,
	); err != nil {
		log.Printf("warning: failed to save assistant reply to chat_history: %v", err)
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": reply})
}

// History handles GET /api/chat/history.
func (h *ChatHandler) History(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query(
		`SELECT id, role, content, created_at FROM chat_history ORDER BY created_at DESC LIMIT 50`,
	)
	if err != nil {
		httpError(w, "query failed: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var msgs []models.ChatMessage
	for rows.Next() {
		var m models.ChatMessage
		if err := rows.Scan(&m.ID, &m.Role, &m.Content, &m.CreatedAt); err != nil {
			log.Printf("warning: failed to scan chat_history row: %v", err)
			continue
		}
		msgs = append(msgs, m)
	}

	for i, j := 0, len(msgs)-1; i < j; i, j = i+1, j-1 {
		msgs[i], msgs[j] = msgs[j], msgs[i]
	}
	if msgs == nil {
		msgs = []models.ChatMessage{}
	}

	writeJSON(w, http.StatusOK, map[string]any{"history": msgs})
}

// buildSystemPrompt reads the profile table and constructs the system prompt.
func (h *ChatHandler) buildSystemPrompt() string {
	profile := h.loadProfile()

	aiName, _ := profile["ai_name"]
	if aiName == "" {
		aiName = "ME"
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("Eres %s, un asistente personal de memoria y organización.\n\n", aiName))

	if work, ok := profile["work"]; ok && work != "" {
		sb.WriteString(fmt.Sprintf("El usuario trabaja en: %s\n", work))
	}
	if goal, ok := profile["goal_90d"]; ok && goal != "" {
		sb.WriteString(fmt.Sprintf("Su meta en 90 días: %s\n", goal))
	}
	if friction, ok := profile["friction"]; ok && friction != "" {
		sb.WriteString(fmt.Sprintf("Su fricción recurrente: %s\n", friction))
	}
	if style, ok := profile["cognitive_style"]; ok && style != "" {
		sb.WriteString(fmt.Sprintf("Cómo toma decisiones: %s\n", style))
	}
	if flow, ok := profile["flow_context"]; ok && flow != "" {
		sb.WriteString(fmt.Sprintf("Su contexto de flow: %s\n", flow))
	}

	sb.WriteString("\nResponde de forma directa y concisa.")
	return sb.String()
}

func (h *ChatHandler) loadProfile() map[string]string {
	rows, err := h.db.Query("SELECT key, value FROM profile")
	if err != nil {
		return map[string]string{}
	}
	defer rows.Close()
	profile := make(map[string]string)
	for rows.Next() {
		var k, v string
		if err := rows.Scan(&k, &v); err != nil {
			log.Printf("warning: failed to scan profile row: %v", err)
			continue
		}
		profile[k] = v
	}
	return profile
}

func (h *ChatHandler) loadHistory(n int) []models.ChatMessage {
	rows, err := h.db.Query(
		`SELECT id, role, content, created_at FROM chat_history ORDER BY created_at DESC LIMIT ?`, n,
	)
	if err != nil {
		return nil
	}
	defer rows.Close()

	var msgs []models.ChatMessage
	for rows.Next() {
		var m models.ChatMessage
		if err := rows.Scan(&m.ID, &m.Role, &m.Content, &m.CreatedAt); err != nil {
			log.Printf("warning: failed to scan chat_history row: %v", err)
			continue
		}
		msgs = append(msgs, m)
	}
	for i, j := 0, len(msgs)-1; i < j; i, j = i+1, j-1 {
		msgs[i], msgs[j] = msgs[j], msgs[i]
	}
	return msgs
}

func (h *ChatHandler) callOllama(messages []ollamaMessage) (string, error) {
	payload := ollamaChatRequest{Model: h.ollamaModel, Messages: messages, Stream: false}
	body, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("marshal: %w", err)
	}

	resp, err := http.Post(h.ollamaURL+"/api/chat", "application/json", bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("ollama unreachable: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("ollama status %d", resp.StatusCode)
	}

	var result ollamaChatResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("decode: %w", err)
	}
	return result.Message.Content, nil
}

// probeOllama checks if Ollama is reachable with a lightweight GET.
func (h *ChatHandler) probeOllama() bool {
	resp, err := http.Get(h.ollamaURL + "/api/tags")
	if err != nil {
		return false
	}
	resp.Body.Close()
	return resp.StatusCode == http.StatusOK
}
