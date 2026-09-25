/**
 * Captura de microfono en PCM16.
 * Vive en public/ y no en src/ porque AudioWorklet carga el archivo por URL
 * en tiempo de ejecucion, no por import.
 * MediaRecorder NO sirve aqui: entrega webm/opus, no PCM crudo.
 */
class PCMWorklet extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buf = [];
    this._n = 0;
    this._target = 1200; // 50 ms a 24 kHz
  }

  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;

    const pcm = new Int16Array(ch.length);
    for (let i = 0; i < ch.length; i++) {
      const s = Math.max(-1, Math.min(1, ch[i]));
      pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    // El quantum de AudioWorklet son 128 muestras (~5 ms). Acumulamos hasta
    // 50 ms para no inundar el hilo principal con mensajes diminutos.
    this._buf.push(pcm);
    this._n += pcm.length;
    if (this._n >= this._target) {
      const out = new Int16Array(this._n);
      let off = 0;
      for (const b of this._buf) { out.set(b, off); off += b.length; }
      this._buf = [];
      this._n = 0;
      this.port.postMessage(out.buffer, [out.buffer]);
    }
    return true;
  }
}

registerProcessor('pcm-worklet', PCMWorklet);
