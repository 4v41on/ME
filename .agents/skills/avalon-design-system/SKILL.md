---
name: avalon-design-system
description: Sistema de diseño Avalon para ME y proyectos del ecosistema (vo1d, Cleopatra, Morgana). Pantalla única, esfera 3D como fondo, UI como overlay flotante. Negro puro, violeta #a855f7, cian #00d4ff. Geist fonts. Use cuando construyas UI para cualquier proyecto Avalon.
---

# Avalon Design System

Sistema de diseño para el ecosistema Avalon. Minimalista, negro, con la EvaSphere como
protagonista visual. Inspirado en Active Theory y Aristide Benoist.

## Principios

1. **La esfera es el hero** — nunca compite con la UI
2. **Negro puro** — `#000000`, no gris oscuro
3. **UI como overlay** — todo flota sobre el fondo 3D
4. **Fuente mono para todo** — Geist Mono da coherencia sistémica
5. **Sin bordes decorativos** — solo separadores funcionales (`border-[#27272a]`)
6. **Sin radios excesivos** — `rounded-none` para arquitectura de grid, `rounded-full` solo para pills/avatares

---

## Paleta

```css
--background:           #000000;   /* fondo absoluto */
--background-secondary: #0a0a0a;   /* cards, panels */
--background-tertiary:  #141414;   /* inputs, hovers */
--foreground:           #fafafa;   /* texto principal */
--foreground-secondary: #a1a1a1;   /* texto secundario */
--foreground-tertiary:  #71717a;   /* labels, placeholders */
--accent-primary:       #a855f7;   /* violeta — acción, énfasis */
--accent-secondary:     #00d4ff;   /* cian — datos, estado, éxito */
--border:               #27272a;   /* bordes sutiles */
```

## Tipografía

```tsx
// layout.tsx
import { Geist, Geist_Mono } from "next/font/google"
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })
```

- **Body/UI**: `font-sans` (Geist Sans)
- **Labels/código/estados**: `font-mono` (Geist Mono)
- **Tracking en labels**: `uppercase tracking-widest text-xs`

---

## Layout: Pantalla única

```
Root  h-screen  overflow-hidden  bg-black
├── [z-0]  Canvas R3F — absolute inset-0 (EvaSphere)
├── [z-20] Overlay de transición (fade/glitch)
├── [z-30] UI flotante (logo, status, chat, trigger)
└── [z-50] SlideOverPanel (cuando abierto)
```

El Canvas **NUNCA** tiene fondo opaco. `gl={{ alpha: true }}`.

---

## Componentes clave

### CustomCursor
```tsx
// Ring 36px, border-white, mix-blend-difference, lerp 0.12
// Se expande en hover de [data-cursor] y elementos interactivos
// cursor: none en globals.css
```

### GlitchText
```tsx
// Tres capas: base + cian (#00d4ff) + violeta (#a855f7)
// mix-blend-multiply en layers secundarias
// Glitch periódico: desplazamiento X ±4px, cada 4-8s
// Uso: logos, títulos principales
```

### TriggerButton (MagneticButton)
```tsx
// Botón circular 56px, bg-[#a855f7]
// Efecto magnético: offset = (cursor - center) * 0.35
// box-shadow pulsante: 0 0 24px #a855f7aa
// Icono: símbolo cuneiforme 𒈨
```

### SlideOverPanel
```tsx
// fixed right-0 inset-y-0, w-[460px]
// bg-black border-l border-[#27272a]
// Animación: CSS translate-x-full → translate-x-0, 350ms ease-out
// Overlay: bg-black/60, opacity fade
// Tabs internas: border-b con línea activa bg-[#a855f7]
```

### TypewriterText
```tsx
// Carácter por carácter, velocidad configurable (default 28ms/char)
// Cursor parpadeante: inline-block 2px bg-current
// onComplete callback
```

---

## SphereState — estados de la esfera

```tsx
type SphereState =
  | "dormant"      // sistema frío, escala 0.6
  | "awakening"    // onboarding inicia
  | "listening"    // input activo
  | "thinking"     // procesando
  | "remembering"  // búsqueda, cian dominante
  | "growing"      // respuesta en onboarding (+0.04 escala)
  | "born"         // onboarding completo, expansión épica
  | "alive"        // estado base post-onboarding
  | "memory_saved" // pulso al guardar
```

```tsx
const { setSphereState } = useSphere()
setSphereState("thinking")           // al enviar al backend
setSphereState("memory_saved", 1000) // auto-revierte en 1s
setSphereState("born")               // al completar onboarding
```

La esfera también reacciona automáticamente via SSE (`useSphereEvents`) a:
- `save_memory` MCP → `memory_saved`
- `search_memory` MCP → `remembering`
- `complete_phase2` MCP → `born`

---

## Onboarding: experiencia cinematográfica

- Esfera siempre visible como fondo
- Texto aparece con `TypewriterText` (30ms/char)
- Prefix `›` en violeta antes de cada línea del sistema
- Inputs: `border-bottom` only, `bg-transparent`
- Botones: solo flecha `→` con `group-hover:translate-x-1`
- Transiciones entre pasos: fade opacity + glitch flash violeta 350ms
- La esfera evoluciona: `dormant → awakening → growing(×13) → born → alive`

---

## Convenciones CSS (Tailwind v4)

```css
/* En globals.css */
@keyframes triggerPulse { ... }
@keyframes fadeInUp { ... }
@keyframes fadeIn { ... }

.animate-fade-in-up { animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
.animate-fade-in    { animation: fadeIn 0.4s ease both; }
```

## Performance

- `audioData` como **ref**, no state — elimina 60fps re-renders
- `setProgress` máximo cada 250ms
- Canvas con `gl={{ antialias: true, alpha: true }}`
- Geist fonts: 2 fuentes en lugar de 3
- Cursor: `will-change-transform` + `requestAnimationFrame` (no Motion)
- `next/dynamic` con `ssr: false` para todos los componentes Canvas

## Proyectos del ecosistema que usan este design system

- **ME** (`D:/Users/User/Documents/ME/`) — memoria personal
- **vo1d** (`D:/Users/User/Documents/eva-core/vo1d/`) — EVA Core frontend
- **Cleopatra** — en desarrollo (testing)
- **Morgana** — producto comercial Avalon (futuro)
