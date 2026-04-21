/**
 * questions.ts — Preguntas del onboarding de ME.
 *
 * Dos bloques con propósitos distintos:
 *
 * BLOQUE A — Perfil del usuario (quién es)
 *   → Genera USER-PROFILE.md (CAG)
 *   → Responde: ¿con quién habla el agente?
 *
 * BLOQUE B — Cómo interactúa el agente (protocolo de relación)
 *   → Genera HOW-TO-TALK.md (CAG)
 *   → Responde: ¿cómo se relacionan?
 */

export type QuestionType = "text" | "select" | "multiselect";

export interface Question {
  id: string;
  block: "user_profile" | "interaction";
  blockLabel: string;
  text: string;
  placeholder?: string;
  type: QuestionType;
  options?: string[];
  /** Si true, muestra campo de texto libre además de las opciones */
  withText?: boolean;
}

// ─── Bloque A — Perfil del usuario ───────────────────────────────────────────
// Quién es, qué hace, cómo funciona, fortalezas, cómo crece.
// Todo lo que el agente necesita saber SOBRE el usuario.

const USER_PROFILE_QUESTIONS: Question[] = [
  {
    id: "work",
    block: "user_profile",
    blockLabel: "Quién eres",
    text: "¿En qué trabajas o qué estás construyendo ahora mismo?",
    placeholder: "Trabajo, proyecto, negocio — lo que sea real hoy.",
    type: "text",
  },
  {
    id: "goal_3m",
    block: "user_profile",
    blockLabel: "Quién eres",
    text: "¿Qué quieres lograr en los próximos 3 meses? Sé específico.",
    placeholder: "Meta concreta, no abstracta.",
    type: "text",
  },
  {
    id: "main_obstacle",
    block: "user_profile",
    blockLabel: "Quién eres",
    text: "¿Cuál es el obstáculo más concreto que tienes ahora mismo?",
    placeholder: "No 'quiero crecer' — el bloqueo específico de esta semana.",
    type: "text",
  },
  {
    id: "organization_system",
    block: "user_profile",
    blockLabel: "Cómo funciones",
    text: "¿Cómo organizas tus tareas ahora? ¿Funciona?",
    type: "select",
    options: [
      "Apps (Notion, Todoist, etc.)",
      "Cuaderno físico",
      "En la cabeza",
      "No me organizo",
    ],
    withText: true,
  },
  {
    id: "what_slips",
    block: "user_profile",
    blockLabel: "Cómo funciones",
    text: "¿Qué se te escapa con más frecuencia?",
    type: "multiselect",
    options: ["Tareas", "Compromisos", "Ideas", "Todo"],
  },
  {
    id: "real_work_ratio",
    block: "user_profile",
    blockLabel: "Cómo funciones",
    text: "¿Cuánto tiempo al día dedicas a trabajo real vs. apagar fuegos?",
    placeholder: "Ej: '4h real / 2h fuegos' o 'casi todo es fuegos'.",
    type: "text",
  },
  {
    id: "work_style",
    block: "user_profile",
    blockLabel: "Cómo funciones",
    text: "¿En qué contexto produces mejor? Hora, lugar, solo o acompañado, música o silencio.",
    placeholder: "Describe tu contexto ideal.",
    type: "text",
  },
  {
    id: "strength_blindspot",
    block: "user_profile",
    blockLabel: "Cómo funciones",
    text: "¿Cuál es tu mayor fortaleza real y cuál tu punto ciego más grande?",
    placeholder: "Dos respuestas: fortaleza / punto ciego.",
    type: "text",
  },
  {
    id: "failed_habit",
    block: "user_profile",
    blockLabel: "Cómo creces",
    text: "¿Qué hábito llevas más tiempo intentando construir sin lograrlo?",
    placeholder: "Honestidad brutal requerida.",
    type: "text",
  },
  {
    id: "neglected_area",
    block: "user_profile",
    blockLabel: "Cómo creces",
    text: "¿Qué área de tu vida está más descuidada ahora mismo?",
    type: "multiselect",
    options: ["Salud", "Relaciones", "Aprendizaje", "Finanzas", "Proyectos personales"],
    withText: true,
  },
  {
    id: "learning",
    block: "user_profile",
    blockLabel: "Cómo creces",
    text: "¿Qué estás aprendiendo ahora o qué quieres aprender?",
    placeholder: "Puede ser cualquier cosa — técnico, personal, teórico.",
    type: "text",
  },
];

// ─── Bloque B — Cómo interactúa el agente ────────────────────────────────────
// Qué tipo de ayuda quiere el usuario y cómo quiere que le hablen.
// Todo lo que el agente necesita saber sobre CÓMO relacionarse.

const INTERACTION_QUESTIONS: Question[] = [
  {
    id: "help_type",
    block: "interaction",
    blockLabel: "Cómo quieres ayuda",
    text: "¿Qué tipo de ayuda te resulta más útil?",
    type: "multiselect",
    options: [
      "Que me recuerden cosas",
      "Que analicen la situación",
      "Que generen ideas",
      "Que me cuestionen",
    ],
  },
  {
    id: "communication_style",
    block: "interaction",
    blockLabel: "Cómo quieres ayuda",
    text: "Cuando te desvías de tus metas, ¿cómo quieres que tu agente te lo diga?",
    type: "select",
    options: [
      "Directo y sin rodeos",
      "Con contexto y razones",
      "Con pregunta en vez de afirmación",
      "Que no diga nada a menos que lo pregunte",
    ],
  },
];

export const QUESTIONS: Question[] = [
  ...USER_PROFILE_QUESTIONS,
  ...INTERACTION_QUESTIONS,
];

export const TOTAL_USER_PROFILE = USER_PROFILE_QUESTIONS.length;
export const TOTAL_QUESTIONS = QUESTIONS.length;
