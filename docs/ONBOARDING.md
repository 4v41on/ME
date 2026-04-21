# ONBOARDING.md — Flujo de onboarding

El onboarding ocurre una sola vez: la primera vez que el usuario abre la app. El resultado es un perfil persistido en SQLite que el chat usa en cada conversación.

---

## Flujo

```
Abrir app → GET /api/profile → onboarding_complete?
  ↓ NO
Pantalla 0: Nombrar la IA (ai_name)
  ↓
Preguntas 1–13 (secuenciales, una por pantalla)
  ↓
POST /api/profile → guarda todas las respuestas
  ↓
Pantalla resumen: nombre + 3 líneas de lo que entendió
  ↓
Entrar al dashboard
```

## Las 13 preguntas

| # | ID | Bloque | Tipo |
|---|----|--------|------|
| 1 | work | Qué haces | texto |
| 2 | main_obstacle | Qué haces | texto |
| 3 | goal_3m | Qué haces | texto |
| 4 | organization_system | Cómo te organizas | select + texto |
| 5 | what_slips | Cómo te organizas | multiselect |
| 6 | real_work_ratio | Cómo te organizas | texto |
| 7 | failed_habit | Cómo creces | texto |
| 8 | neglected_area | Cómo creces | multiselect + texto |
| 9 | learning | Cómo creces | texto |
| 10 | work_style | Cómo trabajas | texto |
| 11 | strength_blindspot | Cómo trabajas | texto |
| 12 | help_type | Cómo quieres ayuda | multiselect |
| 13 | communication_style | Cómo quieres ayuda | select |

## Cómo usa el sistema el perfil

El chat handler (`handlers/chat.go`) carga el perfil completo de la tabla `profile` y construye un system prompt personalizado:

```
Eres {ai_name}, un asistente personal de memoria y organización.

El usuario trabaja en: {work}
Su meta en 3 meses: {goal_3m}
Su obstáculo principal ahora: {main_obstacle}
Cómo trabaja mejor: {work_style}
Cómo prefiere que le hablen cuando se desvía: {communication_style}

Responde de forma directa y concisa.
```

El usuario no tiene que re-explicar quién es en cada sesión.

## Re-hacer el onboarding

Para reiniciar el onboarding, borra la clave `ai_name` de la tabla `profile`:

```bash
sqlite3 backend/me.db "DELETE FROM profile WHERE key = 'ai_name';"
```

O borra toda la tabla para empezar desde cero:

```bash
sqlite3 backend/me.db "DELETE FROM profile;"
```
