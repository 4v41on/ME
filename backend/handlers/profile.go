package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"me/backend/models"

	"github.com/google/uuid"
)

// onboardingCompleteRequest es el body de POST /api/onboarding/complete.
type onboardingCompleteRequest struct {
	AIName    string            `json:"ai_name"`
	Archetype string            `json:"archetype"`
	Answers   []models.ProfileEntry `json:"answers"`
}

// CompleteOnboarding handles POST /api/onboarding/complete.
//
// Hace todo en un solo request:
//  1. Valida el arquetipo
//  2. Guarda perfil en SQLite (ai_name, archetype, todas las respuestas, phase1_complete)
//  3. Planta seeds del arquetipo en Šà (categoría: reflexion)
//  4. Guarda respuestas en Šà (categoría: perfil)
//  5. Genera vault/ (AGENT-IDENTITY.md, USER-PROFILE.md, HOW-TO-TALK.md)
func (h *ProfileHandler) CompleteOnboarding(vaultPath string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req onboardingCompleteRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			httpError(w, "invalid JSON body", http.StatusBadRequest)
			return
		}

		if req.AIName == "" {
			httpError(w, "ai_name is required", http.StatusBadRequest)
			return
		}

		archetype, ok := GetArchetype(req.Archetype)
		if !ok {
			httpError(w, "arquetipo inválido: "+req.Archetype, http.StatusBadRequest)
			return
		}

		now := time.Now().UTC().Format(time.RFC3339)

		// --- 1. Guardar perfil en SQLite ---
		tx, err := h.db.Begin()
		if err != nil {
			httpError(w, "transaction failed", http.StatusInternalServerError)
			return
		}

		upsert := func(key, value string) error {
			_, err := tx.Exec(
				`INSERT INTO profile (key, value, updated_at) VALUES (?, ?, ?)
				 ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
				key, value, now,
			)
			return err
		}

		if err := upsert("ai_name", req.AIName); err != nil {
			tx.Rollback()
			httpError(w, "upsert failed: "+err.Error(), http.StatusInternalServerError)
			return
		}
		if err := upsert("archetype", req.Archetype); err != nil {
			tx.Rollback()
			httpError(w, "upsert failed: "+err.Error(), http.StatusInternalServerError)
			return
		}
		if err := upsert("phase1_complete", "true"); err != nil {
			tx.Rollback()
			httpError(w, "upsert failed: "+err.Error(), http.StatusInternalServerError)
			return
		}

		answerMap := make(map[string]string, len(req.Answers))
		for _, e := range req.Answers {
			if e.Key == "" {
				continue
			}
			answerMap[e.Key] = e.Value
			if err := upsert(e.Key, e.Value); err != nil {
				tx.Rollback()
				httpError(w, "upsert failed: "+err.Error(), http.StatusInternalServerError)
				return
			}
		}

		if err := tx.Commit(); err != nil {
			httpError(w, "commit failed", http.StatusInternalServerError)
			return
		}

		// --- 2. Plantar seeds del arquetipo en Šà (reflexion) ---
		for _, seed := range archetype.Seeds {
			id := newUUID()
			title := archetype.Name + " — seed"
			if _, err := h.db.Exec(
				`INSERT INTO memories (id, category, title, content, metadata, tags, created_at, updated_at)
				 VALUES (?, 'reflexion', ?, ?, '{}', '["arquetipo","seed","'||?||'"]', ?, ?)`,
				id, title, seed, req.Archetype, now, now,
			); err != nil {
				log.Printf("warning: failed to plant archetype seed %q: %v", title, err)
			}
		}

		// --- 3. Guardar respuestas del onboarding en Šà (perfil) ---
		allEntries := append([]models.ProfileEntry{
			{Key: "ai_name", Value: req.AIName},
			{Key: "archetype", Value: req.Archetype},
		}, req.Answers...)
		_ = SaveOnboardingMemories(h.db, allEntries)

		// --- 4. Generar vault/ ---
		if err := GenerateVault(vaultPath, req.AIName, archetype, answerMap); err != nil {
			log.Printf("warning: vault generation failed: %v", err)
			writeJSON(w, http.StatusOK, map[string]any{
				"ok":              true,
				"vault_warning":   err.Error(),
				"phase1_complete": true,
			})
			return
		}

		writeJSON(w, http.StatusOK, map[string]any{
			"ok":              true,
			"files_generated": []string{FileAgentIdentity, FileUserProfile, FileHowToTalk},
			"phase1_complete": true,
		})
	}
}

// CompletePhase2 handles POST /api/onboarding/phase2/complete.
// El LLM llama este endpoint al terminar el onboarding conversacional.
func (h *ProfileHandler) CompletePhase2(w http.ResponseWriter, r *http.Request) {
	now := time.Now().UTC().Format(time.RFC3339)
	_, err := h.db.Exec(
		`INSERT INTO profile (key, value, updated_at) VALUES ('phase2_complete', 'true', ?)
		 ON CONFLICT(key) DO UPDATE SET value = 'true', updated_at = excluded.updated_at`,
		now,
	)
	if err != nil {
		httpError(w, "db error: "+err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "phase2_complete": true})
}

// ProfileHandler handles /api/profile routes.
type ProfileHandler struct {
	db *sql.DB
}

// NewProfileHandler returns a ProfileHandler wired to db.
func NewProfileHandler(db *sql.DB) *ProfileHandler {
	return &ProfileHandler{db: db}
}

// Get handles GET /api/profile.
// Returns all profile key-value pairs and whether onboarding is complete.
func (h *ProfileHandler) Get(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query("SELECT key, value, updated_at FROM profile")
	if err != nil {
		httpError(w, "query failed: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	entries := []models.ProfileEntry{}
	for rows.Next() {
		var e models.ProfileEntry
		rows.Scan(&e.Key, &e.Value, &e.UpdatedAt)
		entries = append(entries, e)
	}

	phase1, phase2, complete := false, false, false
	for _, e := range entries {
		switch e.Key {
		case "phase1_complete":
			phase1 = e.Value == "true"
		case "phase2_complete":
			phase2 = e.Value == "true"
		case "ai_name":
			complete = true
		}
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"entries":             entries,
		"onboarding_complete": complete,
		"phase1_complete":     phase1,
		"phase2_complete":     phase2,
	})
}

// Save handles POST /api/profile.
// Accepts an array of {key, value} pairs and upserts them.
// Used by the onboarding flow to persist all 13 answers at once.
func (h *ProfileHandler) Save(w http.ResponseWriter, r *http.Request) {
	var entries []models.ProfileEntry
	if err := json.NewDecoder(r.Body).Decode(&entries); err != nil {
		httpError(w, "invalid JSON body", http.StatusBadRequest)
		return
	}

	if len(entries) == 0 {
		httpError(w, "entries array is empty", http.StatusBadRequest)
		return
	}

	now := time.Now().UTC().Format(time.RFC3339)

	tx, err := h.db.Begin()
	if err != nil {
		httpError(w, "transaction failed", http.StatusInternalServerError)
		return
	}

	for _, e := range entries {
		if e.Key == "" {
			continue
		}
		_, err := tx.Exec(
			`INSERT INTO profile (key, value, updated_at) VALUES (?, ?, ?)
			 ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
			e.Key, e.Value, now,
		)
		if err != nil {
			tx.Rollback()
			httpError(w, "upsert failed: "+err.Error(), http.StatusInternalServerError)
			return
		}
	}

	if err := tx.Commit(); err != nil {
		httpError(w, "commit failed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"saved": len(entries),
	})
}

// SaveMemories saves onboarding answers as memories in Šà (category: perfil).
// Called internally after the profile is saved — not a direct HTTP endpoint.
func SaveOnboardingMemories(db *sql.DB, entries []models.ProfileEntry) error {
	now := time.Now().UTC().Format(time.RFC3339)
	for _, e := range entries {
		if e.Key == "" || e.Value == "" {
			continue
		}
		id := newUUID()
		content := e.Key + ": " + e.Value
		_, err := db.Exec(
			`INSERT INTO memories (id, category, title, content, metadata, tags, created_at, updated_at)
			 VALUES (?, 'perfil', ?, ?, '{}', '["onboarding","perfil"]', ?, ?)`,
			id, e.Key, content, now, now,
		)
		if err != nil {
			return err
		}
	}
	return nil
}

// Reset handles DELETE /api/profile.
// Borra todos los datos de perfil y las memorias plantadas por el onboarding
// para que el usuario pueda repetir el proceso desde cero.
func (h *ProfileHandler) Reset(w http.ResponseWriter, r *http.Request) {
	tx, err := h.db.Begin()
	if err != nil {
		httpError(w, "transaction failed", http.StatusInternalServerError)
		return
	}

	if _, err := tx.Exec("DELETE FROM profile"); err != nil {
		tx.Rollback()
		httpError(w, "delete profile failed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Borrar memorias generadas por onboarding (perfil + seeds de arquetipo)
	// Busca 'onboarding' o 'seed' en cualquier posición del array de tags.
	if _, err := tx.Exec(
		`DELETE FROM memories
		 WHERE category IN ('perfil', 'reflexion')
		   AND (tags LIKE '%"onboarding"%' OR tags LIKE '%"seed"%')`,
	); err != nil {
		log.Printf("warning: failed to delete onboarding memories during reset: %v", err)
	}

	if err := tx.Commit(); err != nil {
		httpError(w, "commit failed", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "reset": true})
}

// ensure fmt is used
var _ = fmt.Sprintf

func newUUID() string {
	return uuid.New().String()
}
