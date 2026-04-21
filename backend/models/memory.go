package models

// Categories supported by the Šà memory system.
const (
	CategoryTarea      = "tarea"
	CategoryNota       = "nota"
	CategoryRecordatorio = "recordatorio"
	CategoryEstadoAnimo  = "estado_animo"
	CategoryReflexion    = "reflexion"
	CategoryLogro        = "logro"
	CategoryAprendizaje  = "aprendizaje"
	CategoryPregunta     = "pregunta"
	CategoryPerfil       = "perfil"
)

// ValidCategories is the set of allowed category values.
var ValidCategories = map[string]bool{
	CategoryTarea:        true,
	CategoryNota:         true,
	CategoryRecordatorio: true,
	CategoryEstadoAnimo:  true,
	CategoryReflexion:    true,
	CategoryLogro:        true,
	CategoryAprendizaje:  true,
	CategoryPregunta:     true,
	CategoryPerfil:       true,
}

// Memory represents a single entry in the Šà system.
type Memory struct {
	ID        string `json:"id"`
	Category  string `json:"category"`
	Title     string `json:"title"`
	Content   string `json:"content"`
	Metadata  string `json:"metadata"`   // JSON string with category-specific fields
	Tags      string `json:"tags"`       // JSON array string e.g. ["tag1","tag2"]
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

// CreateMemoryRequest is the payload for POST /api/memories.
type CreateMemoryRequest struct {
	Category string `json:"category"`
	Title    string `json:"title"`
	Content  string `json:"content"`
	Metadata string `json:"metadata"`
	Tags     string `json:"tags"`
}

// UpdateMemoryRequest is the payload for PUT /api/memories/:id.
type UpdateMemoryRequest struct {
	Title    string `json:"title"`
	Content  string `json:"content"`
	Metadata string `json:"metadata"`
	Tags     string `json:"tags"`
}

// MemoryListResponse is the response for GET /api/memories.
type MemoryListResponse struct {
	Memories []Memory `json:"memories"`
	Total    int      `json:"total"`
}

// SearchResponse is the response for GET /api/search.
type SearchResponse struct {
	Results []Memory `json:"results"`
}

// ChatMessage represents a single turn in the conversation.
type ChatMessage struct {
	ID        string `json:"id"`
	Role      string `json:"role"`    // "user" | "assistant"
	Content   string `json:"content"`
	CreatedAt string `json:"created_at"`
}

// DashboardStats is the response for GET /api/dashboard.
type DashboardStats struct {
	TotalMemories    int            `json:"total_memories"`
	TareasPendientes int            `json:"tareas_pendientes"`
	TareasHoy        int            `json:"tareas_hoy"`
	PorCategoria     map[string]int `json:"por_categoria"`
	Recientes        []Memory       `json:"recientes"`
}

// ProfileEntry is a key-value pair from the user profile.
type ProfileEntry struct {
	Key       string `json:"key"`
	Value     string `json:"value"`
	UpdatedAt string `json:"updated_at"`
}
