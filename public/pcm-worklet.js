/**
 * Captura de microfono en PCM16 a 24 kHz.
 * Vive en public/ y no en src/ porque AudioWorklet carga el archivo por URL
 * en tiempo de ejecucion, no por import.
 * MediaRecorder NO sirve aqui: entrega webm/opus, no PCM crudo.
 *
 * El AudioContext corre a la tasa nativa del dispositivo (44.1/48 kHz):
 * Firefox no permite conectar el microfono a un contexto con otra tasa. Aqui
 * se reduce a 24 kHz (lo que pide AssemblyAI) promediando las muestras que
 * caen en cada paso, que ademas funciona como un filtro paso-bajo sencillo.
 */
class PCMWorklet extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const target = (options && options.processorOptions && options.processorOptions.targetRate) || 24000;
    // `sampleRate` es global dentro de un AudioWorklet: la tasa del contexto.
    this._ratio = sampleRate / target;
    this._carry = 0;   // fraccion de muestra pendiente entre bloques
    this._sum = 0;     // acumulado del paso en curso
    this._count = 0;
    this._out = [];
    this._target = Math.round(target * 0.05); // 50 ms por mensaje
  }

  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;

    for (let i = 0; i < ch.length; i++) {
      this._sum += ch[i];
      this._count += 1;
      this._carry += 1;
      if (this._carry >= this._ratio) {
        this._carry -= this._ratio;
        const s = Math.max(-1, Math.min(1, this._sum / this._count));
        this._out.push(s < 0 ? s * 0x8000 : s * 0x7fff);
        this._sum = 0;
        this._count = 0;
      }
    }

    // El quantum de AudioWorklet son 128 muestras (~3 ms). Acumulamos hasta
    // 50 ms para no inundar el hilo principal con mensajes diminutos.
    if (this._out.length >= this._target) {
      const pcm = Int16Array.from(this._out);
      this._out = [];
      this.port.postMessage(pcm.buffer, [pcm.buffer]);
    }
    return true;
  }
}

registerProcessor('pcm-worklet', PCMWorklet);
