/**
 * AudioEngine — Web Audio API wrapper for EvaSphere.
 *
 * Loads audio files, exposes an AnalyserNode, and provides
 * normalized frequency data for the sphere shader.
 * No microphone — only reacts to the playlist.
 */

export interface AudioData {
  /** Normalized amplitude 0–1 from low-freq bands (20–200Hz) */
  amplitude: number;
  /** Normalized dominant frequency 0–1 */
  frequency: number;
  /** Raw frequency array from AnalyserNode */
  raw: Uint8Array<ArrayBuffer>;
}

export class AudioEngine {
  private context: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: AudioBufferSourceNode | MediaElementAudioSourceNode | null = null;
  private audioEl: HTMLAudioElement | null = null;
  private dataArray: Uint8Array<ArrayBuffer> = new Uint8Array(0);

  /** Connects an <audio> element to the analyser. Call once per track. */
  connect(audioEl: HTMLAudioElement): void {
    // Reuse existing context if running
    if (!this.context || this.context.state === "closed") {
      this.context = new AudioContext();
    }

    // Disconnect previous source if any
    if (this.source) {
      try {
        (this.source as MediaElementAudioSourceNode).disconnect();
      } catch {}
    }

    this.audioEl = audioEl;

    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;

    const src = this.context.createMediaElementSource(audioEl);
    src.connect(this.analyser);
    this.analyser.connect(this.context.destination);
    this.source = src;

    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
  }

  /** Resume AudioContext after user gesture (required by browsers). */
  async resume(): Promise<void> {
    if (this.context?.state === "suspended") {
      await this.context.resume();
    }
  }

  /**
   * Sample — call every animation frame.
   * Returns normalized amplitude and frequency for shader uniforms.
   */
  sample(): AudioData {
    if (!this.analyser || this.dataArray.length === 0) {
      return { amplitude: 0, frequency: 0, raw: new Uint8Array(0) as Uint8Array<ArrayBuffer> };
    }

    this.analyser.getByteFrequencyData(this.dataArray);

    // Low-frequency band (first ~25% of bins = 20–200Hz range)
    const lowBandEnd = Math.floor(this.dataArray.length * 0.25);
    let sum = 0;
    for (let i = 0; i < lowBandEnd; i++) {
      sum += this.dataArray[i];
    }
    const amplitude = sum / (lowBandEnd * 255);

    // Dominant frequency: find peak bin, normalize to 0–1
    let peakBin = 0;
    let peakVal = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      if (this.dataArray[i] > peakVal) {
        peakVal = this.dataArray[i];
        peakBin = i;
      }
    }
    const frequency = peakBin / this.dataArray.length;

    return { amplitude, frequency, raw: this.dataArray };
  }

  destroy(): void {
    try {
      this.source?.disconnect();
      this.analyser?.disconnect();
      this.context?.close();
    } catch {}
    this.context = null;
    this.analyser = null;
    this.source = null;
    this.audioEl = null;
  }
}
