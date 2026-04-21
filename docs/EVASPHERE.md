# EVASPHERE.md — Cómo funciona la esfera

La EvaSphere es una esfera 3D que respira con la música. No reacciona al usuario — reacciona al audio ambiente.

---

## Stack

- **React Three Fiber** — renderer 3D en React
- **Three.js** — WebGL
- **ShaderMaterial** — vertex + fragment shaders escritos a mano
- **Web Audio API** — AnalyserNode extrae frecuencias en tiempo real

---

## Perlin 4D

El shader usa **4D Simplex Noise** (cnoise). Las 4 dimensiones son:

```
xyz  → posición del vértice en el espacio (posición en la esfera)
w    → tiempo + frecuencia del audio
```

Esto produce una deformación orgánica que cambia suavemente con el tiempo y salta en los picos de audio.

## Flujo de datos

```
Archivo .mp3/.ogg en /public/audio/
  ↓
AudioContext + AnalyserNode (fftSize: 256)
  ↓
AudioEngine.sample() → { amplitude, frequency }
  ↓
useFrame() → uniforms uAmplitude, uFrequency → vertex shader
  ↓
Deformación = noise * (0.08 + amplitude * 0.35)
```

## Uniforms del shader

| Uniform | Tipo | Rango | Descripción |
|---------|------|-------|-------------|
| `uTime` | float | 0→∞ | Tiempo elapsed del reloj Three.js |
| `uAmplitude` | float | 0–1 | Amplitud normalizada de bajas frecuencias |
| `uFrequency` | float | 0–1 | Frecuencia dominante normalizada |

## Color

La esfera responde visualmente a la intensidad del audio:

| Intensidad | Color |
|------------|-------|
| Silencio | Negro profundo `#050508` |
| Medio | Violeta índigo `#6C63FF` |
| Pico | Cyan etéreo `#00D4FF` |

El violeta es el color filosófico de Avalon — síntesis de polaridad. El cyan es el color técnico del sistema.

El Fresnel glow agrega un borde luminoso en la silueta de la esfera.

## Agregar música

1. Copia archivos `.mp3` / `.ogg` / `.wav` a `frontend/public/audio/`
2. Reinicia el servidor (`make run`)
3. El player los detecta automáticamente vía `GET /api/playlist`

El archivo `binaural-40hz.ogg` viene incluido por defecto.
