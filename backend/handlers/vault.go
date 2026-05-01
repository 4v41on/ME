package handlers

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// VaultFiles son los tres archivos CAG generados al completar el onboarding.
// El usuario los copia a su Obsidian (o los linkea via ME_VAULT_PATH).
// Son la capa CAG: siempre presentes en el contexto de cada sesión.
const (
	FileAgentIdentity = "AGENT-IDENTITY.md"
	FileUserProfile   = "USER-PROFILE.md"
	FileHowToTalk     = "HOW-TO-TALK.md"
)

// GenerateVault crea la estructura del vault a partir del perfil del usuario
// y el arquetipo elegido.
//
// Estructura generada:
//
//	vault/
//	├── User/
//	│   └── USER-PROFILE.md          ← [L2] perfil del usuario
//	└── {agentName}/
//	    ├── AGENT-IDENTITY.md        ← [L1] constitución + [L3] capacidades
//	    ├── HOW-TO-TALK.md           ← [L4] protocolo de relación
//	    ├── skills/README.md
//	    ├── hooks/README.md
//	    ├── subagents/README.md
//	    └── plugins/README.md
func GenerateVault(vaultPath string, aiName string, archetype Archetype, answers map[string]string) error {
	// Prevent path traversal via agent name
	if strings.ContainsAny(aiName, `/\`) || strings.Contains(aiName, "..") || aiName == "" {
		return fmt.Errorf("ai_name inválido: no puede contener '/', '\\' ni '..'")
	}

	agentDir := filepath.Join(vaultPath, aiName)
	userDir  := filepath.Join(vaultPath, "User")

	for _, dir := range []string{agentDir, userDir} {
		if err := os.MkdirAll(dir, 0755); err != nil {
			return fmt.Errorf("no se pudo crear directorio %s: %w", dir, err)
		}
	}

	now := time.Now().Format("2006-01-02")

	if err := writeFile(filepath.Join(agentDir, FileAgentIdentity),
		buildAgentIdentity(aiName, archetype, now)); err != nil {
		return err
	}
	if err := writeFile(filepath.Join(userDir, FileUserProfile),
		buildUserProfile(aiName, answers, now)); err != nil {
		return err
	}
	if err := writeFile(filepath.Join(agentDir, FileHowToTalk),
		buildHowToTalk(aiName, answers, now)); err != nil {
		return err
	}

	// Crear carpetas de capas con placeholder hasta Fase 2
	layers := []struct{ dir, content string }{
		{"skills", fmt.Sprintf("# Skills de %s\n\nEsta carpeta se completa en la Fase 2 del onboarding.\nCada skill es un archivo `.md` que define una capacidad específica del agente.\n", aiName)},
		{"hooks", fmt.Sprintf("# Hooks de %s\n\nEsta carpeta se completa en la Fase 2 del onboarding.\nCada hook es un comportamiento determinístico que se dispara en un evento específico.\n", aiName)},
		{"subagents", fmt.Sprintf("# Subagents de %s\n\nEsta carpeta se completa en la Fase 2 del onboarding.\nCada subagent define un dominio de delegación para tareas específicas.\n", aiName)},
		{"plugins", fmt.Sprintf("# Plugins de %s\n\nEsta carpeta se completa en la Fase 2 del onboarding.\nCada plugin es un bundle instalable de skills + hooks para un contexto específico.\n", aiName)},
	}
	for _, l := range layers {
		dir := filepath.Join(agentDir, l.dir)
		if err := os.MkdirAll(dir, 0755); err != nil {
			return fmt.Errorf("no se pudo crear %s: %w", dir, err)
		}
		if err := writeFile(filepath.Join(dir, "README.md"), l.content); err != nil {
			return err
		}
	}

	return nil
}

// buildAgentIdentity genera AGENT-IDENTITY.md.
//
// [L1] CONSTITUCIÓN — nombre, arquetipo, voz, valores core. Inmutable.
// [L3] CAPACIDADES  — placeholder; se completa en Fase 2 con skills/hooks/subagents reales.
func buildAgentIdentity(aiName string, a Archetype, date string) string {
	seeds := make([]string, len(a.Seeds))
	for i, s := range a.Seeds {
		seeds[i] = "- " + s
	}

	return fmt.Sprintf(`---
tipo: agent-identity
agente: %s
arquetipo: %s
generado: %s
---

# %s

---

## [L1] CONSTITUCIÓN — inmutable

**Nombre:** %s
**Arquetipo:** %s

### Quién soy

%s

### Cómo pienso

%s

### Valores core

%s

---

## [L3] CAPACIDADES

> Las skills, hooks y subagents de %s se configuran en la Fase 2 del onboarding.
> Esta sección se actualiza automáticamente al completar los formularios de configuración.

### Skills activas
*(pendiente — Fase 2)*

### Hooks configurados
*(pendiente — Fase 2)*

### Subagents disponibles
*(pendiente — Fase 2)*

---

> [!note] Este archivo define la identidad base de %s.
> Es completamente editable — modifícalo para moldear cómo piensa y cómo habla.
> %s lo leerá al inicio de cada sesión como contexto estático (CAG Layer 1).
`,
		aiName, a.Name, date,
		aiName,
		aiName,
		a.Name,
		a.Brief,
		a.SystemSeed,
		strings.Join(seeds, "\n"),
		aiName,
		aiName,
		aiName,
	)
}

// buildUserProfile genera USER-PROFILE.md.
//
// [L2] PERFIL — quién es el usuario: qué construye, cómo piensa, quién es.
// Alimentado por las 9 preguntas del Bloque A del onboarding.
func buildUserProfile(aiName string, a map[string]string, date string) string {
	get := func(key string) string {
		if v := a[key]; v != "" {
			return v
		}
		return "—"
	}

	return fmt.Sprintf(`---
tipo: user-profile
generado: %s
---

# Perfil del usuario

---

## [L2] PERFIL

### Qué construye

**Trabajo / proyecto / rol:** %s

**Por qué importa:** %s

### A dónde va

**Meta en 90 días:** %s

**Fricción recurrente:** %s

### Cómo piensa

**Modo de decisión:** %s

**Contexto de flow:** %s

### Quién es

**Superpoder:** %s

**Punto ciego:** %s

**Crecimiento ahora:** %s

---

> [!note] Este archivo es la memoria consciente del usuario que %s lee en cada sesión.
> Se actualiza a medida que crece la interacción via Šà y update_vault.
> Los detalles granulares viven en Šà (RAG) — aquí está la síntesis.
> CAG Layer 2.
`,
		date,
		get("work"),
		get("purpose"),
		get("goal_90d"),
		get("friction"),
		get("cognitive_style"),
		get("flow_context"),
		get("superpower"),
		get("blind_spot"),
		get("growth_edge"),
		aiName,
	)
}

// buildHowToTalk genera HOW-TO-TALK.md.
//
// [L4] PROTOCOLO DE RELACIÓN — cómo trabajan juntos, qué quiere el usuario del agente,
// límites explícitos y ancla de memoria permanente.
// Alimentado por las 4 preguntas del Bloque B del onboarding.
func buildHowToTalk(aiName string, a map[string]string, date string) string {
	get := func(key string) string {
		if v := a[key]; v != "" {
			return v
		}
		return "—"
	}

	return fmt.Sprintf(`---
tipo: interaction-protocol
agente: %s
generado: %s
---

# Cómo trabajamos

---

## [L4] PROTOCOLO DE RELACIÓN

### Rol del agente

Lo que el usuario quiere que %s haga y él no hace bien solo:

%s

### Estilo de feedback

Cuando el usuario toma una mala decisión, %s debe:

%s

### Ancla de memoria permanente

Lo que %s nunca debe olvidar, sin importar cuánto tiempo pase:

> %s

### Zonas prohibidas

Lo que %s no debe hacer nunca, sin importar el contexto:

> %s

---

> [!note] Este protocolo define cómo %s se relaciona con el usuario.
> Es editable — si algo no encaja, modifícalo directamente aquí.
> El cambio se refleja en la próxima sesión.
> CAG Layer 4.
`,
		aiName, date,
		aiName,
		get("agent_role"),
		aiName,
		get("feedback_style"),
		aiName,
		get("memory_core"),
		aiName,
		get("limits"),
		aiName,
	)
}

func writeFile(path, content string) error {
	if err := os.WriteFile(path, []byte(content), 0644); err != nil {
		return fmt.Errorf("error escribiendo %s: %w", filepath.Base(path), err)
	}
	return nil
}
