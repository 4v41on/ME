package handlers

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// VaultFiles son los tres archivos CAG generados al completar el onboarding.
// El usuario los copia a su Obsidian (o los linkea).
// Son la capa CAG: siempre presentes en el contexto de cada sesión.
const (
	FileAgentIdentity = "AGENT-IDENTITY.md"
	FileUserProfile   = "USER-PROFILE.md"
	FileHowToTalk     = "HOW-TO-TALK.md"
)

// GenerateVault crea los tres archivos del vault a partir del perfil del usuario
// y el arquetipo elegido. El directorio vaultPath se crea si no existe.
//
// Estructura generada:
//
//	vault/
//	├── AGENT-IDENTITY.md   ← quién es el agente (CAG)
//	├── USER-PROFILE.md     ← quién es el usuario (CAG)
//	└── HOW-TO-TALK.md      ← protocolo de relación (CAG)
func GenerateVault(vaultPath string, aiName string, archetype Archetype, answers map[string]string) error {
	if err := os.MkdirAll(vaultPath, 0755); err != nil {
		return fmt.Errorf("no se pudo crear el directorio vault: %w", err)
	}

	now := time.Now().Format("2006-01-02")

	if err := writeFile(filepath.Join(vaultPath, FileAgentIdentity),
		buildAgentIdentity(aiName, archetype, now)); err != nil {
		return err
	}
	if err := writeFile(filepath.Join(vaultPath, FileUserProfile),
		buildUserProfile(aiName, answers, now)); err != nil {
		return err
	}
	if err := writeFile(filepath.Join(vaultPath, FileHowToTalk),
		buildHowToTalk(aiName, answers, now)); err != nil {
		return err
	}

	return nil
}

// buildAgentIdentity genera AGENT-IDENTITY.md.
// Define quién es el agente: nombre, arquetipo, voz, rasgos core.
// El usuario puede editar este archivo directamente en Obsidian.
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

**Arquetipo:** %s

## Quién soy

%s

## Cómo pienso

%s

## Valores core

%s

---

> Este archivo define la personalidad base de %s.
> Es completamente editable — modifícalo para moldear cómo piensa y cómo habla.
> %s lo leerá al inicio de cada sesión como contexto estático (CAG).
`,
		aiName, a.Name, date,
		aiName,
		a.Name,
		a.Brief,
		a.SystemSeed,
		strings.Join(seeds, "\n"),
		aiName,
		aiName,
	)
}

// buildUserProfile genera USER-PROFILE.md.
// Define quién es el usuario: trabajo, metas, cómo funciona, fortalezas.
// Se actualiza a medida que el agente aprende más sobre el usuario.
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

## Qué hace

**Trabajo / proyecto:** %s

**Objetivo próximos 3 meses:** %s

**Obstáculo más urgente ahora:** %s

## Cómo funciona

**Sistema de organización:** %s

**Qué se le escapa:** %s

**Tiempo real vs fuegos:** %s

**Contexto ideal de trabajo:** %s

## Fortalezas y puntos ciegos

%s

## Crecimiento

**Hábito pendiente:** %s

**Área más descuidada:** %s

**Aprendiendo ahora:** %s

---

> Este archivo es la memoria consciente del usuario que %s lee en cada sesión.
> Se actualiza a medida que crece la interacción.
> Los detalles granulares viven en Šà (RAG) — aquí está la síntesis.
`,
		date,
		get("work"),
		get("goal_3m"),
		get("main_obstacle"),
		get("organization_system"),
		get("what_slips"),
		get("real_work_ratio"),
		get("work_style"),
		get("strength_blindspot"),
		get("failed_habit"),
		get("neglected_area"),
		get("learning"),
		aiName,
	)
}

// buildHowToTalk genera HOW-TO-TALK.md.
// Define el protocolo de relación entre el agente y el usuario.
// Responde: ¿qué tipo de ayuda quiere? ¿cómo quiere que le digan las cosas?
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

# Cómo nos relacionamos

## Qué tipo de ayuda es más útil

%s

## Cómo decirle cuando se desvía de sus metas

%s

---

> Este protocolo define cómo %s se comunica con el usuario.
> Es editable — si el estilo no encaja, modifícalo aquí y el cambio
> se refleja en la próxima sesión.
`,
		aiName, date,
		get("help_type"),
		get("communication_style"),
		aiName,
	)
}

func writeFile(path, content string) error {
	if err := os.WriteFile(path, []byte(content), 0644); err != nil {
		return fmt.Errorf("error escribiendo %s: %w", filepath.Base(path), err)
	}
	return nil
}
