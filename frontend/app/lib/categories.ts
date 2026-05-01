/**
 * categories.ts — fuente única de verdad para categorías de Šà.
 *
 * Las 9 categorías están definidas en el backend (models/memory.go).
 * Este archivo es el equivalente frontend: paleta de colores y utilidades.
 * Importar desde aquí — nunca definir CATEGORY_ACCENT localmente.
 */

export const CATEGORIES = [
  "tarea",
  "nota",
  "reflexion",
  "aprendizaje",
  "logro",
  "recordatorio",
  "estado_animo",
  "pregunta",
  "perfil",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_ACCENT: Record<string, string> = {
  tarea:        "#a855f7",
  nota:         "#52525b",
  reflexion:    "#52525b",
  aprendizaje:  "#00d4ff",
  logro:        "#a855f7",
  recordatorio: "#00d4ff",
  estado_animo: "#a855f7",
  pregunta:     "#71717a",
  perfil:       "#a855f7",
};

/** Devuelve el color accent de una categoría, o un fallback si es desconocida. */
export function categoryColor(cat: string): string {
  return CATEGORY_ACCENT[cat] ?? "#52525b";
}
