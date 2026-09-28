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
 *   POST /api/coach   -> correcciones y flashcards en vivo durante la clase
 */

const TOKEN_URL = 'https://agents.assemblyai.com/v1/token';
const GATEWAY_URL = 'https://llm-gateway.assemblyai.com/v1/chat/completions';
const SESSION_SECONDS = 300;
const BAD_KEY = 'The AssemblyAI API key is invalid. Check ASSEMBLYAI_API_KEY in .env.local and restart the server.';

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
    throw new HttpError(429, 'The tutor has reached its class limit for today. Come back tomorrow.');
  }

  const hour = 3_600_000;
  const now = Date.now();
  const recent = (perIp.get(ip) ?? []).filter((t) => now - t < hour);
  const limit = num('TOKENS_PER_IP_PER_HOUR', 12);
  if (recent.length >= limit) {
    const waitMin = Math.ceil((hour - (now - recent[0])) / 60_000);
    perIp.set(ip, recent);
    throw new HttpError(429, `You reached the hourly class limit. Try again in ${waitMin} min.`);
  }
  recent.push(now);
  perIp.set(ip, recent);
}

// ------------------------------------------------------------ token

async function mintToken() {
  const key = env('ASSEMBLYAI_API_KEY');
  if (!key) throw new HttpError(500, 'ASSEMBLYAI_API_KEY is missing on the server');

  const url = new URL(TOKEN_URL);
  url.searchParams.set('expires_in_seconds', '120');
  // 5 min por sesion. El default son 3 HORAS: una pestana olvidada te
  // drenaria los creditos.
  url.searchParams.set('max_session_duration_seconds', String(SESSION_SECONDS));

  // OJO: el Voice Agent API EXIGE 'Bearer'. El LLM Gateway (abajo) va con
  // la key cruda. No se generaliza entre productos.
  const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
  if (!res.ok) {
    const text = await res.text();
    console.error('[token]', res.status, text);
    // Con una key invalida el endpoint de voz responde 404 {"detail":"Invalid API key"},
    // no 401: hay que mirar tambien el cuerpo.
    const badKey = res.status === 401 || res.status === 403 || /invalid api key/i.test(text);
    throw new HttpError(502, badKey
      ? BAD_KEY
      : 'AssemblyAI did not respond. Please try again.');
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
  if (!key) throw new HttpError(500, 'ASSEMBLYAI_API_KEY is missing on the server');
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
    throw new HttpError(502, res.status === 401 ? BAD_KEY : 'No se pudo generar el reporte. Intenta de nuevo.');
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

// ------------------------------------------------------------ coach en vivo
//
// Durante la clase el navegador manda las ultimas frases y aqui se piden
// correcciones (errores del alumno) y flashcards (palabras utiles del tutor).
//
// Por que asi y no de otra forma (probado contra la API real):
//  - El Voice Agent NO sirve para esto: con tools, su modelo lee en voz alta
//    "show_correction{better:" en vez de llamarlas, y tarda ~13 s.
//  - El plan de la cuenta solo da acceso a un modelo chico del LLM Gateway,
//    sin response_format, con un limite de ~2 pedidos por minuto. Por eso el
//    JSON se extrae del texto y el navegador agrupa frases y respeta el 429.

const COACH_KINDS = ['grammar', 'vocabulary', 'pronunciation'];
const CARD_KINDS = ['word', 'adjective', 'verb', 'phrase', 'grammar'];
const NATIVE_NAME = { es: 'Spanish', en: 'English', fr: 'French', de: 'German', ja: 'Japanese', it: 'Italian' };

/**
 * Saca el primer objeto JSON de un texto. El modelo chico a veces agrega texto
 * alrededor o deja el JSON sin cerrar (le falta la "}" final): se cierran las
 * llaves y corchetes pendientes antes de parsear.
 */
function firstJsonObject(text) {
  const start = text.indexOf('{');
  if (start === -1) return null;
  const stack = [];
  let inString = false;
  let end = text.length;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (ch === '\\') i++;
      else if (ch === '"') inString = false;
    } else if (ch === '"') inString = true;
    else if (ch === '{' || ch === '[') stack.push(ch === '{' ? '}' : ']');
    else if (ch === '}' || ch === ']') {
      stack.pop();
      if (stack.length === 0) { end = i + 1; break; }
    }
  }
  let candidate = text.slice(start, end);
  if (stack.length) {
    if (inString) candidate += '"';
    candidate = candidate.replace(/,\s*$/, '') + stack.reverse().join('');
  }
  try { return JSON.parse(candidate); } catch { return null; }
}

const clip = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');

async function coach(body) {
  const { turns, targetLang, nativeLang, level } = body ?? {};
  if (!Array.isArray(turns) || turns.length === 0) throw new HttpError(400, 'Nothing to analyze');
  const clean = turns
    .slice(-12)
    .filter((t) => t && (t.role === 'tutor' || t.role === 'student') && typeof t.text === 'string' && typeof t.id === 'string')
    .map((t) => ({ id: t.id.slice(0, 64), role: t.role, text: t.text.slice(0, 600) }));
  if (!clean.some((t) => t.role === 'student')) return { corrections: [], cards: [] };

  const key = env('ASSEMBLYAI_API_KEY');
  if (!key) throw new HttpError(500, 'ASSEMBLYAI_API_KEY is missing on the server');
  const target = LANG_NAME[targetLang] ?? 'the target language';
  const native = NATIVE_NAME[nativeLang] ?? 'English';
  const lvl = String(level ?? 'A2').slice(0, 4);

  const system = [
    `You help a student learning ${target} (level ${lvl}). Their native language is ${native}.`,
    'You get the latest turns of a SPOKEN lesson, transcribed by speech recognition.',
    'Reply with ONLY one JSON object, no markdown, no other text:',
    '{"corrections":[{"said":"","better":"","explanation":"","kind":"grammar|vocabulary|pronunciation"}],"cards":[{"term":"","meaning":"","note":"","kind":"word|adjective|verb|phrase|grammar"}]}',
    '',
    'corrections: real mistakes in STUDENT lines only, at most 2, most important first.',
    '- "said": copied EXACTLY from a Student line: the smallest COMPLETE clause that contains the mistake',
    '  (for word-order mistakes, the whole clause). "better": that same clause fully corrected in ' + target + '; it MUST differ from "said".',
    `- "explanation": one short sentence in ${native}.`,
    '- kind "pronunciation" only when a word looks like a mis-heard, similar-sounding version of the word the student meant.',
    '- Ignore punctuation and capitalization. If the student made no mistakes, return "corrections": [].',
    'cards: 1 or 2 useful items the TUTOR used (word, adjective, verb, phrase or grammar point) worth learning at this level.',
    `- "term": copied EXACTLY from a Tutor line. "meaning" and "note" (a short usage tip) in ${native}.`,
  ].join('\n');
  const dialogue = clean.map((t) => `${t.role === 'tutor' ? 'Tutor' : 'Student'}: ${t.text}`).join('\n');

  const res = await fetch(GATEWAY_URL, {
    method: 'POST',
    headers: { Authorization: key, 'content-type': 'application/json' },
    body: JSON.stringify({
      model: env('COACH_MODEL', 'qwen3.5-4b-32k-fast'),
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: dialogue },
      ],
      max_tokens: 600,
      temperature: 0,
    }),
  });
  if (res.status === 429) {
    const retry = Number(res.headers.get('retry-after')) || 30;
    const err = new HttpError(429, 'Coach is rate limited');
    err.retryAfter = retry;
    throw err;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('[coach] error', res.status, JSON.stringify(data).slice(0, 400));
    throw new HttpError(502, res.status === 401 ? BAD_KEY : 'The coach could not analyze this turn.');
  }
  const raw = data.choices?.[0]?.message?.content ?? '';
  if (env('COACH_DEBUG')) console.log('[coach] raw', raw);
  const out = firstJsonObject(raw) ?? {};

  // Candado anti-alucinacion (igual que el reporte): una correccion solo vale
  // si lo que "dijo" el alumno aparece en sus frases; una tarjeta, si el tutor
  // de verdad uso ese termino. Asi tambien sabemos debajo de que mensaje va.
  const findTurn = (role, quote) => {
    const q = norm(quote);
    if (!q) return null;
    return [...clean].reverse().find((t) => t.role === role && norm(t.text).includes(q)) ?? null;
  };
  const corrections = (Array.isArray(out.corrections) ? out.corrections : [])
    .map((c) => ({ c, turn: findTurn('student', c?.said) }))
    .filter(({ c, turn }) => turn && norm(c.better) && norm(c.better) !== norm(c.said))
    .slice(0, 2)
    .map(({ c, turn }) => ({
      turnId: turn.id,
      said: clip(c.said, 200),
      better: clip(c.better, 200),
      explanation: clip(c.explanation, 300),
      kind: COACH_KINDS.includes(c.kind) ? c.kind : 'grammar',
    }));
  const cards = (Array.isArray(out.cards) ? out.cards : [])
    .map((c) => ({ c, turn: findTurn('tutor', c?.term) }))
    .filter(({ c, turn }) => turn && clip(c.meaning, 1))
    .slice(0, 2)
    .map(({ c, turn }) => ({
      turnId: turn.id,
      term: clip(c.term, 80),
      meaning: clip(c.meaning, 200),
      note: clip(c.note, 300),
      kind: CARD_KINDS.includes(c.kind) ? c.kind : 'word',
    }));
  return { corrections, cards };
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
    } else if (req.method === 'POST' && pathname === '/api/coach') {
      send(res, 200, await coach(await readJson(req)));
    } else {
      send(res, 404, { error: 'Ruta no encontrada' });
    }
  } catch (err) {
    if (!err.expose) console.error('[api]', err);
    send(res, err.status ?? 500, {
      error: err.expose ? err.message : 'Error interno del servidor',
      ...(err.retryAfter ? { retryAfter: err.retryAfter } : {}),
    });
  }
  return true;
}
