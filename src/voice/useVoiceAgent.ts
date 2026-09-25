import { useCallback, useEffect, useRef, useState } from 'react';
import { buildSession, canSpeak, type SessionOpts } from './agentConfig';

const WS_URL = 'wss://agents.assemblyai.com/v1/ws';
const RATE = 24_000;

export type AgentState =
  | 'idle'        // sin conectar
  | 'connecting'
  | 'listening'   // el turno es del alumno
  | 'thinking'    // procesando lo que dijo
  | 'speaking'    // el tutor esta hablando
  | 'error';

export interface VoiceTranscript {
  role: 'tutor' | 'student';
  text: string;
}

interface Options {
  targetLang: string;
  nativeLang: string;
  level: string;
  topic?: string;
  onTranscript?: (t: VoiceTranscript) => void;
}

// ---------------------------------------------------------------- base64

function encode(buf: ArrayBuffer): string {
  const u8 = new Uint8Array(buf);
  let s = '';
  const CHUNK = 0x8000; // fromCharCode revienta con arreglos enormes
  for (let i = 0; i < u8.length; i += CHUNK) {
    s += String.fromCharCode(...u8.subarray(i, i + CHUNK));
  }
  return btoa(s);
}

function decode(b64: string): Int16Array {
  const u8 = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return new Int16Array(u8.buffer, u8.byteOffset, u8.byteLength / 2);
}

// ---------------------------------------------------------------- hook

export function useVoiceAgent(opts: Options) {
  const [state, setState] = useState<AgentState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [activeLang, setActiveLang] = useState(opts.targetLang);

  const ws = useRef<WebSocket | null>(null);
  const micCtx = useRef<AudioContext | null>(null);
  const outCtx = useRef<AudioContext | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const worklet = useRef<AudioWorkletNode | null>(null);
  const nextPlay = useRef(0);
  const sources = useRef(new Set<AudioBufferSourceNode>());
  const busy = useRef(false);            // evita dobles arranques (StrictMode)
  const history = useRef<VoiceTranscript[]>([]);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  /** Corta el audio en reproduccion. Se usa cuando el alumno interrumpe. */
  const flush = useCallback(() => {
    sources.current.forEach((s) => { try { s.stop(); } catch { /* ya termino */ } });
    sources.current.clear();
    nextPlay.current = 0;
  }, []);

  const teardown = useCallback(() => {
    flush();
    try { ws.current?.close(); } catch { /* ignorar */ }
    ws.current = null;
    worklet.current?.disconnect();
    worklet.current = null;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    micCtx.current?.close().catch(() => {});
    micCtx.current = null;
    outCtx.current?.close().catch(() => {});
    outCtx.current = null;
    busy.current = false;
  }, [flush]);

  /** Reproduce un chunk agendandolo en el reloj de audio, sin setTimeout. */
  const play = useCallback((b64: string) => {
    const ctx = outCtx.current;
    if (!ctx) return;
    const pcm = decode(b64);
    const f32 = new Float32Array(pcm.length);
    for (let i = 0; i < pcm.length; i++) f32[i] = pcm[i] / 0x8000;

    const buffer = ctx.createBuffer(1, f32.length, RATE);
    buffer.copyToChannel(f32, 0);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);

    // Un colchon de 60 ms absorbe el jitter de red sin que se note.
    const at = Math.max(ctx.currentTime + 0.06, nextPlay.current);
    src.start(at);
    nextPlay.current = at + buffer.duration;
    sources.current.add(src);
    src.onended = () => sources.current.delete(src);
  }, []);

  const connect = useCallback(
    async (session: SessionOpts, rehydrate?: string) => {
      const res = await fetch('/api/token');
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.token) {
        // El servidor manda mensajes pensados para el alumno: limite por hora,
        // tope diario, key invalida. Se muestran tal cual.
        throw new Error(data.error ?? `No se pudo conectar con el tutor (${res.status})`);
      }
      const token: string = data.token;

      const socket = new WebSocket(`${WS_URL}?token=${token}`);
      ws.current = socket;
      setActiveLang(session.rescue ? session.nativeLang : session.targetLang);

      socket.onopen = () => {
        socket.send(JSON.stringify(buildSession(session)));
        if (rehydrate) {
          socket.send(JSON.stringify({
            type: 'conversation.message',
            role: 'system',
            content: rehydrate,
          }));
        }
      };

      socket.onerror = () => { setError('Se perdió la conexión con el tutor'); setState('error'); };
      socket.onclose = () => { if (state !== 'error') setState('idle'); };

      socket.onmessage = (ev) => {
        const msg = JSON.parse(ev.data as string);
        switch (msg.type) {
          case 'session.ready':
            setState('listening');
            break;

          case 'input.speech.started':
            setState('listening');
            break;

          case 'transcript.user':
            if (msg.text?.trim()) {
              const t: VoiceTranscript = { role: 'student', text: msg.text };
              history.current.push(t);
              optsRef.current.onTranscript?.(t);
              setState('thinking');
            }
            break;

          case 'reply.audio':
            // OJO: aqui el campo es 'data'. En input.audio es 'audio'.
            setState('speaking');
            play(msg.data);
            break;

          case 'transcript.agent':
            if (msg.text?.trim()) {
              const t: VoiceTranscript = { role: 'tutor', text: msg.text };
              history.current.push(t);
              optsRef.current.onTranscript?.(t);
            }
            break;

          case 'reply.done':
            if (msg.status === 'interrupted') flush();
            setState('listening');
            break;

          case 'session.error':
            setError(msg.message ?? 'Error de sesión');
            setState('error');
            break;
        }
      };

      // --- microfono ---
      const media = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,   // sin esto el tutor se oye a si mismo y se interrumpe
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
      stream.current = media;

      const mic = new AudioContext({ sampleRate: RATE });
      micCtx.current = mic;
      await mic.audioWorklet.addModule('/pcm-worklet.js');
      const node = new AudioWorkletNode(mic, 'pcm-worklet');
      worklet.current = node;
      node.port.onmessage = (e: MessageEvent<ArrayBuffer>) => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'input.audio', audio: encode(e.data) }));
        }
      };
      mic.createMediaStreamSource(media).connect(node);
      // El worklet no produce salida; conectarlo al destino lo mantiene vivo
      // en algunos navegadores sin que se oiga nada.
      node.connect(mic.destination);

      const out = new AudioContext({ sampleRate: RATE });
      outCtx.current = out;
      await out.resume();
    },
    [flush, play, state],
  );

  const start = useCallback(async () => {
    if (busy.current) return;
    if (!canSpeak(opts.targetLang)) {
      setError('Ese idioma todavía no tiene tutor de voz');
      setState('error');
      return;
    }
    busy.current = true;
    setError(null);
    setState('connecting');
    history.current = [];
    try {
      await connect({
        targetLang: opts.targetLang,
        nativeLang: opts.nativeLang,
        level: opts.level,
        topic: opts.topic,
      });
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err));
      setState('error');
      teardown();
    }
  }, [connect, opts.targetLang, opts.nativeLang, opts.level, opts.topic, teardown]);

  const stop = useCallback(() => {
    try { ws.current?.send(JSON.stringify({ type: 'session.end' })); } catch { /* ignorar */ }
    teardown();
    setState('idle');
  }, [teardown]);

  /**
   * El rescate: el tutor se cambia a la voz del idioma nativo del alumno.
   *
   * La voz es INMUTABLE dentro de una sesion, asi que no basta con cambiar
   * el prompt: hay que cerrar y abrir una sesion nueva. El contexto se
   * rehidrata con conversation.message para que retome donde iba.
   */
  const rescue = useCallback(async (back = false) => {
    const o = optsRef.current;
    const summary = history.current.slice(-6)
      .map((t) => `${t.role === 'tutor' ? 'Tutor' : 'Student'}: ${t.text}`)
      .join('\n');

    teardown();
    setState('connecting');
    try {
      await connect(
        {
          targetLang: o.targetLang,
          nativeLang: o.nativeLang,
          level: o.level,
          topic: o.topic,
          rescue: !back,
          greet: false,
        },
        summary
          ? `The lesson so far:\n${summary}\n\nContinue from here. Do not greet again.`
          : undefined,
      );
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err));
      setState('error');
    }
  }, [connect, teardown]);

  useEffect(() => teardown, [teardown]);

  /** Copia de la conversacion completa, para pedir el reporte al terminar. */
  const getTranscript = useCallback(() => history.current.slice(), []);

  return { state, error, activeLang, start, stop, rescue, getTranscript };
}
