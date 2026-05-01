/**
 * questions.ts — Preguntas del onboarding de ME.
 *
 * Exactamente 13 preguntas. Cada una extrae algo único e irreemplazable.
 * Ninguna se repite en intención. Ninguna falta.
 *
 * BLOQUE A — Perfil profundo (9 preguntas)
 *   → Genera USER-PROFILE.md [L2]
 *   → Responde: ¿con quién habla el agente?
 *
 * BLOQUE B — Relación con el agente (4 preguntas)
 *   → Genera HOW-TO-TALK.md [L4]
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

// ─── Bloque A — Perfil profundo ───────────────────────────────────────────────
// 9 preguntas. Quién es, qué construye, cómo piensa, cómo crece.
// Cada respuesta alimenta una sección distinta de USER-PROFILE.md.

const USER_PROFILE_QUESTIONS: Question[] = [
  {
    id: "work",
    block: "user_profile",
    blockLabel: "Qué construyes",
    text: "¿Qué estás construyendo ahora mismo y cuál es tu rol en eso?",
    placeholder: "Proyecto, negocio, trabajo — lo que es real hoy y qué parte es tuya.",
    type: "text",
  },
  {
    id: "purpose",
    block: "user_profile",
    blockLabel: "Qué construyes",
    text: "¿Por qué importa lo que construyes? ¿A quién le cambia algo si funciona?",
    placeholder: "No el pitch — la razón real.",
    type: "text",
  },
  {
    id: "goal_90d",
    block: "user_profile",
    blockLabel: "A dónde vas",
    text: "En 90 días, ¿qué tiene que ser verdad para que digas que fue un buen trimestre?",
    placeholder: "Una sola cosa concreta. No una lista.",
    type: "text",
  },
  {
    id: "friction",
    block: "user_profile",
    blockLabel: "A dónde vas",
    text: "¿Cuál es el problema más recurrente que encuentras solo, sin poder resolverlo fácil?",
    placeholder: "El patrón que se repite, no el problema de esta semana.",
    type: "text",
  },
  {
    id: "cognitive_style",
    block: "user_profile",
    blockLabel: "Cómo piensas",
    text: "¿Cómo tomas decisiones importantes?",
    type: "select",
    options: [
      "Analítico — necesito datos y estructura antes de decidir",
      "Intuitivo — confío en el instinto y ajusto después",
      "Mixto — datos para enmarcar, instinto para cerrar",
      "Depende del contexto",
    ],
    withText: true,
  },
  {
    id: "flow_context",
    block: "user_profile",
    blockLabel: "Cómo piensas",
    text: "¿Cuándo y en qué condiciones produces mejor?",
    placeholder: "Hora del día, lugar, música o silencio, solo o acompañado, estado mental.",
    type: "text",
  },
  {
    id: "superpower",
    block: "user_profile",
    blockLabel: "Quién eres",
    text: "¿Qué haces mejor que casi cualquier persona en tu entorno?",
    placeholder: "Tu ventaja real, no la que suenas bien diciendo.",
    type: "text",
  },
  {
    id: "blind_spot",
    block: "user_profile",
    blockLabel: "Quién eres",
    text: "¿Qué patrón que te limita se repite en tu vida y aún no has podido romper?",
    placeholder: "Honestidad brutal. Nadie más va a leer esto.",
    type: "text",
  },
  {
    id: "growth_edge",
    block: "user_profile",
    blockLabel: "Quién eres",
    text: "¿Qué estás aprendiendo ahora o qué habilidad sientes que necesitas urgentemente?",
    placeholder: "Puede ser técnico, personal, mental — lo que sea real.",
    type: "text",
  },
];

// ─── Bloque B — Relación con el agente ───────────────────────────────────────
// 4 preguntas. Define el protocolo de la relación.
// Cada respuesta alimenta HOW-TO-TALK.md.

const INTERACTION_QUESTIONS: Question[] = [
  {
    id: "agent_role",
    block: "interaction",
    blockLabel: "Cómo trabajamos",
    text: "¿Qué quieres que haga tu agente que tú no haces bien solo?",
    type: "multiselect",
    options: [
      "Recordar todo sin que yo lo repita",
      "Cuestionar mis decisiones antes de que las tome",
      "Organizar lo que tengo en la cabeza",
      "Hacer seguimiento de lo que dije que haría",
    ],
    withText: true,
  },
  {
    id: "feedback_style",
    block: "interaction",
    blockLabel: "Cómo trabajamos",
    text: "Cuando tomas una mala decisión, ¿cómo prefieres que te lo señalen?",
    type: "select",
    options: [
      "Directo y sin rodeos — dime que me equivoqué",
      "Con contexto — explícame por qué antes de juzgar",
      "Con pregunta — que me lleve a verlo yo solo",
      "Solo si lo pregunto — no quiero que me corrija sin pedir",
    ],
  },
  {
    id: "memory_core",
    block: "interaction",
    blockLabel: "Cómo trabajamos",
    text: "¿Qué es lo más importante que tu agente nunca debe olvidar de ti?",
    placeholder: "Una cosa. La más importante. La que define todo lo demás.",
    type: "text",
  },
  {
    id: "limits",
    block: "interaction",
    blockLabel: "Cómo trabajamos",
    text: "¿Qué NO quieres que tu agente haga nunca, sin importar el contexto?",
    placeholder: "Límites explícitos. Lo que no es negociable.",
    type: "text",
  },
];

export const QUESTIONS: Question[] = [
  ...USER_PROFILE_QUESTIONS,
  ...INTERACTION_QUESTIONS,
];

export const TOTAL_USER_PROFILE = USER_PROFILE_QUESTIONS.length;
export const TOTAL_QUESTIONS = QUESTIONS.length;
