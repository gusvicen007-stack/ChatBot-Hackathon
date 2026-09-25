/**
 * Backend de Tandem. Cero dependencias: solo Node.
 *
 * El MISMO handler corre en desarrollo (montado en Vite, ver vite.config.ts)
 * y en produccion (server/index.mjs en Railway). Una sola implementacion.
 *
 * El audio NUNCA pasa por aqui: el navegador habla directo con AssemblyAI.
 * Este servidor solo hace lo que exige la API key:
 *   GET  /api/health  -> estado y consumo del dia
 *   GET  /api/token   -> token de un solo uso para el Voice Agent
 *   POST /api/report  -> retroalimentacion de la clase con el LLM Gateway
 */

const TOKEN_URL = 'https://agents.assemblyai.com/v1/token';
const GATEWAY_URL = 'https://llm-gateway.assemblyai.com/v1/chat/completions';
const SESSION_SECONDS = 300;

// Las variables se leen en cada llamada, no al cargar el modulo: en desarrollo
// Vite carga .env.local DESPUES de importar este archivo.
const env = (k, fallback) => process.env[k] ?? fallback;
const num = (k, fallback) => Number(env(k, fallback));

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.expose = true; // este mensaje si se le puede mostrar al usuario
  }
}

// ------------------------------------------------------------ protecciones
//
// Con una URL publica cualquiera puede pedir tokens, y cada minuto de voz
// cuesta $0.075 de tus creditos. Dos candados:
//   1. por IP, cuenta INTENTOS: nadie acapara ni martillea el tutor
//   2. tope diario global, cuenta SESIONES ABIERTAS: el gasto real tiene techo
// Viven en memoria: se reinician si el servidor se reinicia. Para un
// hackathon es suficiente; en produccion irian a Redis.

const perIp = new Map();
let day = new Date().toISOString().slice(0, 10);
let sessionsToday = 0;

function clientIp(req) {
  // Railway pone el servidor detras de un proxy: la IP real viene en el header.
  const fwd = req.headers['x-forwarded-for'];
  return (Array.isArray(fwd) ? fwd[0] : fwd)?.split(',')[0].trim()
    || req.socket.remoteAddress || 'desconocida';
}

function checkBudget(ip) {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== day) { day = today; sessionsToday = 0; perIp.clear(); }

  const cap = num('DAILY_SESSION_CAP', 60);
  if (sessionsToday >= cap) {
    throw new HttpError(429, 'El tutor ya alcanzó su límite de clases por hoy. Vuelve mañana.');
  }

  const hour = 3_600_000;
  const now = Date.now();
  const recent = (perIp.get(ip) ?? []).filter((t) => now - t < hour);
  const limit = num('TOKENS_PER_IP_PER_HOUR', 12);
  if (recent.length >= limit) {
    const waitMin = Math.ceil((hour - (now - recent[0])) / 60_000);
    perIp.set(ip, recent);
    throw new HttpError(429, `Llegaste al límite de clases por hora. Intenta en ${waitMin} min.`);
  }
  recent.push(now);
  perIp.set(ip, recent);
}

// ------------------------------------------------------------ token

async function mintToken() {
  const key = env('ASSEMBLYAI_API_KEY');
  if (!key) throw new HttpError(500, 'Falta ASSEMBLYAI_API_KEY en el servidor');

  const url = new URL(TOKEN_URL);
  url.searchParams.set('expires_in_seconds', '120');
  // 5 min por sesion. El default son 3 HORAS: una pestana olvidada te
  // drenaria los creditos.
  url.searchParams.set('max_session_duration_seconds', String(SESSION_SECONDS));

  // OJO: el Voice Agent API EXIGE 'Bearer'. El LLM Gateway (abajo) va con
  // la key cruda. No se generaliza entre productos.
  const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
  if (!res.ok) {
    console.error('[token]', res.status, await res.text());
    throw new HttpError(502, res.status === 401
      ? 'La API key de AssemblyAI es inválida'
      : 'AssemblyAI no respondió. Intenta de nuevo.');
  }
  return (await res.json()).token;
}

// ------------------------------------------------------------ reporte

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const LANG_NAME = { es: 'Spanish', en: 'English', fr: 'French', de: 'German', it: 'Italian', ja: 'Japanese' };

const REPORT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    summary: { type: 'string' },
    strengths: { type: 'array', items: { type: 'string' } },
    corrections: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          said: { type: 'string' },
          better: { type: 'string' },
          why: { type: 'string' },
        },
        required: ['said', 'better', 'why'],
      },
    },
    new_vocabulary: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: { term: { type: 'string' }, meaning: { type: 'string' } },
        required: ['term', 'meaning'],
      },
    },
    level_estimate: { type: 'string', enum: LEVELS },
    next_step: { type: 'string' },
  },
  required: ['summary', 'strengths', 'corrections', 'new_vocabulary', 'level_estimate', 'next_step'],
};

/** Minusculas, sin acentos ni puntuacion: para comparar citas sin ser quisquillosos. */
function norm(s) {
  return (s ?? '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}

function validateReportInput(body) {
  const { transcript, targetLang, nativeLang, level, topic } = body ?? {};
  if (!Array.isArray(transcript) || transcript.length === 0) {
    throw new HttpError(400, 'No hay conversación que evaluar');
  }
  if (transcript.length > 200) throw new HttpError(400, 'La conversación es demasiado larga');
  const turns = transcript
    .filter((t) => t && (t.role === 'tutor' || t.role === 'student') && typeof t.text === 'string')
    .map((t) => ({ role: t.role, text: t.text.slice(0, 1000) }));
  if (!turns.some((t) => t.role === 'student')) {
    throw new HttpError(400, 'Todavía no dijiste nada en esta clase');
  }
  return {
    turns,
    target: LANG_NAME[targetLang] ?? 'the target language',
    native: LANG_NAME[nativeLang] ?? 'Spanish',
    level: String(level ?? 'A2').slice(0, 4),
    topic: String(topic ?? '').slice(0, 200),
  };
}

async function buildReport(body) {
  const { turns, target, native, level, topic } = validateReportInput(body);

  const key = env('ASSEMBLYAI_API_KEY');
  if (!key) throw new HttpError(500, 'Falta ASSEMBLYAI_API_KEY en el servidor');
  const dialogue = turns.map((t) => `${t.role === 'tutor' ? 'Tutor' : 'Student'}: ${t.text}`).join('\n');

  const system = [
    `You review a spoken ${target} practice session for a student whose native language is ${native}.`,
    `The student's declared level is ${level}.${topic ? ` Topic: ${topic}.` : ''}`,
    '',
    'RULES:',
    `- Write summary, strengths, why, meaning and next_step in ${native}. Write "better" and "term" in ${target}.`,
    '- "said" MUST be an EXACT quote copied from a Student line. Never paraphrase it, never invent it.',
    '- Only list real mistakes, at most 5, most important first. If there are none, return an empty array.',
    '- The transcript comes from speech recognition: ignore missing punctuation and capitalization.',
    '- Strengths must be specific and grounded in what the student actually said.',
    '- level_estimate is based ONLY on the Student lines.',
    '- next_step: one concrete thing to practice next session, in one sentence.',
  ].join('\n');

  const payload = {
    model: env('LLM_MODEL', 'claude-sonnet-4-6'),
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: dialogue },
    ],
    max_tokens: 1200,
    temperature: 0.2,
    response_format: {
      type: 'json_schema',
      json_schema: { name: 'lesson_report', schema: REPORT_SCHEMA, strict: true },
    },
    // Si el modelo principal falla, el gateway reintenta con otro proveedor.
    fallbacks: [{ model: env('LLM_FALLBACK_MODEL', 'gemini-2.5-flash') }],
    // Repara JSON mal formado del lado del servidor antes de devolverlo.
    post_processing_steps: [{ type: 'json-repair' }],
  };

  const res = await fetch(GATEWAY_URL, {
    method: 'POST',
    headers: { Authorization: key, 'content-type': 'application/json' }, // key cruda, sin Bearer
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  console.log('[report]', res.status, 'model=', data.model, 'request_id=', data.request_id);
  if (!res.ok) {
    console.error('[report] error', JSON.stringify(data).slice(0, 500));
    throw new HttpError(502, 'No se pudo generar el reporte. Intenta de nuevo.');
  }

  let report;
  try {
    report = JSON.parse(data.choices[0].message.content);
  } catch {
    throw new HttpError(502, 'El reporte llegó incompleto. Intenta de nuevo.');
  }

  // Candado anti-alucinacion: una correccion solo sobrevive si lo que dice que
  // dijiste aparece de verdad en tus turnos. El modelo no puede citarte algo
  // que nunca dijiste.
  const spoken = norm(turns.filter((t) => t.role === 'student').map((t) => t.text).join(' '));
  const before = report.corrections?.length ?? 0;
  report.corrections = (report.corrections ?? []).filter((c) => {
    const q = norm(c.said);
    return q.length > 0 && spoken.includes(q);
  });

  return {
    ...report,
    meta: {
      model: data.model,
      request_id: data.request_id,
      corrections_discarded: before - report.corrections.length,
    },
  };
}

// ------------------------------------------------------------ http

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(body));
}

function readJson(req, maxBytes = 64 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > maxBytes) { reject(new HttpError(413, 'Solicitud demasiado grande')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); }
      catch { reject(new HttpError(400, 'JSON inválido')); }
    });
    req.on('error', reject);
  });
}

/** Devuelve true si atendio la peticion; false si no es una ruta /api. */
export async function handleApi(req, res) {
  const { pathname } = new URL(req.url ?? '/', 'http://localhost');
  if (!pathname.startsWith('/api/')) return false;

  try {
    if (req.method === 'GET' && pathname === '/api/health') {
      send(res, 200, {
        ok: true,
        key_loaded: Boolean(env('ASSEMBLYAI_API_KEY')),
        sessions_today: sessionsToday,
        daily_cap: num('DAILY_SESSION_CAP', 60),
        max_voice_minutes_today: (num('DAILY_SESSION_CAP', 60) * SESSION_SECONDS) / 60,
      });
    } else if (req.method === 'GET' && pathname === '/api/token') {
      checkBudget(clientIp(req));
      const token = await mintToken();
      sessionsToday += 1; // solo cuenta si de verdad se abrio una sesion
      send(res, 200, { token });
    } else if (req.method === 'POST' && pathname === '/api/report') {
      send(res, 200, await buildReport(await readJson(req)));
    } else {
      send(res, 404, { error: 'Ruta no encontrada' });
    }
  } catch (err) {
    if (!err.expose) console.error('[api]', err);
    send(res, err.status ?? 500, { error: err.expose ? err.message : 'Error interno del servidor' });
  }
  return true;
}
