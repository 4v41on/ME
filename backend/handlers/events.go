package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"
)

// EventType identifica el tipo de evento emitido por SSE.
type EventType string

const (
	EventMemorySaved    EventType = "memory_saved"
	EventMemoryDeleted  EventType = "memory_deleted"
	EventSearched       EventType = "searched"
	EventPhase2Done     EventType = "phase2_complete"
	EventOnboardingDone EventType = "onboarding_complete"
	EventVaultUpdated   EventType = "vault_updated"
	// Eventos emitidos por el servidor MCP (Claude/OpenCode)
	EventMCPActive EventType = "mcp_active"
	EventMCPSave   EventType = "mcp_save"
	EventMCPSearch EventType = "mcp_search"
	EventMCPVault  EventType = "mcp_vault"
)

// SphereEvent es el payload que se envía al frontend.
type SphereEvent struct {
	Type    EventType `json:"type"`
	Payload any       `json:"payload,omitempty"`
}

// EventBus gestiona los clientes SSE conectados.
// Thread-safe: los handlers lo llaman desde goroutines distintas.
type EventBus struct {
	mu      sync.RWMutex
	clients map[chan SphereEvent]struct{}
}

var Bus = &EventBus{
	clients: make(map[chan SphereEvent]struct{}),
}

// Subscribe registra un canal de cliente y devuelve su canal + función de cleanup.
func (b *EventBus) Subscribe() (chan SphereEvent, func()) {
	ch := make(chan SphereEvent, 8)
	b.mu.Lock()
	b.clients[ch] = struct{}{}
	b.mu.Unlock()
	return ch, func() {
		b.mu.Lock()
		delete(b.clients, ch)
		b.mu.Unlock()
		close(ch)
	}
}

// Publish envía un evento a todos los clientes conectados.
// No bloquea: si el canal está lleno, el evento se descarta para ese cliente.
func (b *EventBus) Publish(e SphereEvent) {
	b.mu.RLock()
	defer b.mu.RUnlock()
	for ch := range b.clients {
		select {
		case ch <- e:
		default:
			// cliente lento — descartamos para no bloquear
		}
	}
}

// EventsHandler maneja GET /api/events (SSE stream) y POST /api/internal/event.
type EventsHandler struct{}

func NewEventsHandler() *EventsHandler { return &EventsHandler{} }

// InternalPublish maneja POST /api/internal/event.
// Llamado por el servidor MCP (misma máquina) para publicar eventos de esfera.
// Solo acepta conexiones de localhost como defensa en profundidad.
func (h *EventsHandler) InternalPublish(w http.ResponseWriter, r *http.Request) {
	// Defense-in-depth: rechazar si no viene de loopback
	host := r.RemoteAddr
	if idx := len(host) - 1; idx >= 0 {
		// Strip port: RemoteAddr = "ip:port"
		for i := len(host) - 1; i >= 0; i-- {
			if host[i] == ':' {
				host = host[:i]
				break
			}
		}
	}
	if host != "127.0.0.1" && host != "::1" {
		httpError(w, "forbidden", http.StatusForbidden)
		return
	}

	var evt SphereEvent
	if err := json.NewDecoder(r.Body).Decode(&evt); err != nil {
		httpError(w, "invalid json: "+err.Error(), http.StatusBadRequest)
		return
	}
	Bus.Publish(evt)
	w.WriteHeader(http.StatusNoContent)
}

func (h *EventsHandler) Stream(w http.ResponseWriter, r *http.Request) {
	// Headers SSE
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")
	w.WriteHeader(http.StatusOK)

	flusher, ok := w.(http.Flusher)
	if !ok {
		httpError(w, "streaming not supported", http.StatusInternalServerError)
		return
	}

	// Evento de conexión
	fmt.Fprintf(w, "data: {\"type\":\"connected\"}\n\n")
	flusher.Flush()

	ch, unsub := Bus.Subscribe()
	defer unsub()

	// Heartbeat cada 25s para mantener la conexión viva
	ticker := time.NewTicker(25 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-r.Context().Done():
			return

		case evt, ok := <-ch:
			if !ok {
				return
			}
			data, err := json.Marshal(evt)
			if err != nil {
				continue
			}
			fmt.Fprintf(w, "data: %s\n\n", data)
			flusher.Flush()

		case <-ticker.C:
			fmt.Fprintf(w, ": heartbeat\n\n")
			flusher.Flush()
		}
	}
}
