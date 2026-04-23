/**
 * BinauralEngine — genera binaural beats con Web Audio API.
 *
 * Crea dos osciladores: uno por oído, con una diferencia de frecuencia
 * que el cerebro percibe como un pulso (beat frequency).
 *
 * El ruido de fondo (brown noise) suma textura y hace que el análisis
 * de frecuencia de la esfera sea más interesante visualmente.
 *
 * Presets:
 *   delta   0.5–4 Hz   — sueño profundo
 *   theta   4–8 Hz     — meditación, creatividad
 *   alpha   8–14 Hz    — relajación, foco suave
 *   beta    14–30 Hz   — foco activo, alerta
 *   gamma   30–50 Hz   — alta concentración
 */

export type BinauralPreset = "delta" | "theta" | "alpha" | "beta" | "gamma";

interface PresetConfig {
  label: string;
  base: number;     // frecuencia portadora (Hz)
  beat: number;     // diferencia entre oídos (Hz) = beat frequency
  colorIndex: number; // 0-1 para el shader (mapeado a paleta de colores)
  sphereSpeed: number; // velocidad de animación de la esfera
  dotColor: string;  // color visual en el player UI
}

export const BINAURAL_PRESETS: Record<BinauralPreset, PresetConfig> = {
  delta: { label: "delta",  base: 160, beat: 2,  colorIndex: 0.0,  sphereSpeed: 0.2,  dotColor: "#4f46e5" },
  theta: { label: "theta",  base: 180, beat: 6,  colorIndex: 0.25, sphereSpeed: 0.35, dotColor: "#a855f7" },
  alpha: { label: "alpha",  base: 200, beat: 10, colorIndex: 0.5,  sphereSpeed: 0.55, dotColor: "#ec4899" },
  beta:  { label: "beta",   base: 220, beat: 20, colorIndex: 0.75, sphereSpeed: 1.0,  dotColor: "#00d4ff" },
  gamma: { label: "gamma",  base: 240, beat: 40, colorIndex: 1.0,  sphereSpeed: 1.6,  dotColor: "#fbbf24" },
};

export class BinauralEngine {
  private ctx: AudioContext | null = null;
  private leftOsc:  OscillatorNode | null = null;
  private rightOsc: OscillatorNode | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private merger: ChannelMergerNode | null = null;
  private masterGain: GainNode | null = null;
  private dataArray: Uint8Array<ArrayBuffer> = new Uint8Array(0) as Uint8Array<ArrayBuffer>;
  private running = false;
  private currentPreset: BinauralPreset = "alpha";
  private startTime = 0;
  private wallStartTime = 0; // fallback cuando AudioContext queda suspendido

  /** Inicia la generación de binaural beats para el preset dado. */
  async start(preset: BinauralPreset, volume = 0.5): Promise<void> {
    // AudioContext se crea ANTES de cualquier await para que el browser
    // lo asocie al gesto del usuario (click). Si se crea después de un
    // await, algunos browsers suspenden el contexto silenciosamente.
    const newCtx = new AudioContext();
    const resumePromise = newCtx.resume(); // inicia resume dentro del gesture

    await this.stop(); // limpia engine anterior (si lo había)
    await resumePromise; // espera que el contexto esté activo

    this.ctx = newCtx;
    this.currentPreset = preset;

    const cfg = BINAURAL_PRESETS[preset];

    // Analyser para que la esfera reaccione
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.85;
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = volume;

    // Merger stereo: input 0 = izquierda, input 1 = derecha
    this.merger = this.ctx.createChannelMerger(2);

    // Oscilador izquierdo (frecuencia base)
    this.leftOsc = this.ctx.createOscillator();
    this.leftOsc.type = "sine";
    this.leftOsc.frequency.value = cfg.base;
    const leftGain = this.ctx.createGain();
    leftGain.gain.value = 0.4;
    this.leftOsc.connect(leftGain);
    leftGain.connect(this.merger, 0, 0);

    // Oscilador derecho (base + beat)
    this.rightOsc = this.ctx.createOscillator();
    this.rightOsc.type = "sine";
    this.rightOsc.frequency.value = cfg.base + cfg.beat;
    const rightGain = this.ctx.createGain();
    rightGain.gain.value = 0.4;
    this.rightOsc.connect(rightGain);
    rightGain.connect(this.merger, 0, 1);

    // Brown noise suave para textura
    const noiseBuffer = this._makeBrownNoise(this.ctx);
    this.noiseSource = this.ctx.createBufferSource();
    this.noiseSource.buffer = noiseBuffer;
    this.noiseSource.loop = true;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.value = 0.04; // muy sutil
    this.noiseSource.connect(noiseGain);
    noiseGain.connect(this.merger, 0, 0);
    noiseGain.connect(this.merger, 0, 1);

    // Merger → masterGain → analyser → salida
    this.merger.connect(this.masterGain);
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    this.leftOsc.start();
    this.rightOsc.start();
    this.noiseSource.start();
    this.running = true;
    this.startTime = this.ctx.currentTime;
    this.wallStartTime = Date.now();
  }

  async stop(): Promise<void> {
    if (!this.running) return;
    try {
      this.leftOsc?.stop();
      this.rightOsc?.stop();
      this.noiseSource?.stop();
      this.ctx?.close();
    } catch {}
    this.leftOsc = null;
    this.rightOsc = null;
    this.noiseSource = null;
    this.analyser = null;
    this.merger = null;
    this.masterGain = null;
    this.ctx = null;
    this.running = false;
  }

  setVolume(v: number): void {
    if (this.masterGain) this.masterGain.gain.value = v;
  }

  get isRunning(): boolean { return this.running; }

  /**
   * Sample — llamar en cada animation frame.
   *
   * La amplitud se calcula matemáticamente desde la frecuencia del beat:
   * dos senos (base y base+beat) se suman → modulación de amplitud real.
   * A(t) = 0.35 + 0.55 * |sin(π * beat_freq * t)|
   *
   * Esto garantiza que la esfera pulse exactamente al ritmo del beat,
   * independientemente del smoothing del AnalyserNode.
   */
  sample(): { amplitude: number; frequency: number; raw: Uint8Array<ArrayBuffer> } {
    if (!this.ctx || !this.running) {
      return { amplitude: 0, frequency: 0, raw: new Uint8Array(0) as Uint8Array<ArrayBuffer> };
    }

    const ctxElapsed = this.ctx.currentTime - this.startTime;
    // Fallback: si AudioContext quedó suspendido (ctx.currentTime no avanza),
    // usamos el reloj de pared para que la esfera igualmente pulse.
    const elapsed = ctxElapsed > 0.005
      ? ctxElapsed
      : (Date.now() - this.wallStartTime) / 1000;

    const cfg = BINAURAL_PRESETS[this.currentPreset];

    // Amplitud = envolvente de la interferencia entre los dos osciladores
    const beatPhase = Math.PI * cfg.beat * elapsed;
    const amplitude = 0.35 + 0.65 * Math.abs(Math.sin(beatPhase));

    // colorIndex normalizado [0,1] — identifica el preset en el shader
    const frequency = cfg.colorIndex;

    return { amplitude, frequency, raw: this.dataArray };
  }

  /** Brown noise buffer (más cálido que white noise). */
  private _makeBrownNoise(ctx: AudioContext): AudioBuffer {
    const length = ctx.sampleRate * 4; // 4 segundos en loop
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
    return buffer;
  }
}
