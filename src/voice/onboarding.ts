/**
 * Registro por voz: Sabio solo conversa; la app entiende las respuestas.
 *
 * Probamos a que el agente guardara el perfil con tools (tool.call), pero el
 * modelo del Voice Agent no es confiable con ellas: a veces no las llama o
 * llama la equivocada, y cada llamada agrega segundos de espera. Aquí se lee
 * cada frase del usuario con reglas fijas (diccionarios en los 5 idiomas), sin
 * depender de ningún LLM, y el resultado se le pasa a Sabio en su prompt.
 */

export const UI_LANGS = ['es', 'en', 'fr', 'de', 'ja'] as const;
export const LEARNABLE = ['en', 'fr', 'de', 'es', 'ja'] as const;
const CEFR = ['A1', 'A2', 'B1', 'B2', 'C1'];
const JLPT = ['N5', 'N4', 'N3', 'N2', 'N1'];

/** Lo que el registro ya sabe del usuario. */
export interface OnboardingKnown {
  uiLanguage?: string | null;
  name?: string | null;
  interests?: string[];
  interestsAnswered?: boolean;
  languages?: { id: string; level: string | null }[];
}

/** Un cambio al perfil. */
export interface ProfileUpdate {
  uiLanguage?: string;
  name?: string;
  interests?: string[];
  /** Respondió la pregunta de intereses (aunque sea "ninguno"). */
  interestsAnswered?: boolean;
  /** Lista COMPLETA de idiomas a aprender; level null = aún no lo dijo. */
  languages?: { id: string; level: string | null }[];
}

export type MissingField = 'app_language' | 'name' | 'interests' | 'languages' | 'levels';

export function missingFields(k: OnboardingKnown): MissingField[] {
  const missing: MissingField[] = [];
  if (!k.uiLanguage) missing.push('app_language');
  if (!k.name) missing.push('name');
  if (!k.interestsAnswered) missing.push('interests');
  if (!k.languages?.length) missing.push('languages');
  else if (k.languages.some((l) => !l.level)) missing.push('levels');
  return missing;
}

/** Aplica un cambio sobre lo que ya se sabía. Un nivel no dicho conserva el anterior. */
export function mergeKnown(known: OnboardingKnown, u: ProfileUpdate): OnboardingKnown {
  const next = { ...known };
  if (u.uiLanguage) next.uiLanguage = u.uiLanguage;
  if (u.name) next.name = u.name;
  if (u.interestsAnswered) {
    next.interests = u.interests ?? [];
    next.interestsAnswered = true;
  }
  if (u.languages) {
    const prev = new Map((known.languages ?? []).map((l) => [l.id, l.level]));
    next.languages = u.languages.map((l) => ({ id: l.id, level: l.level ?? prev.get(l.id) ?? null }));
  }
  return next;
}

// ------------------------------------------------------------ diccionarios

/** minúsculas, sin acentos y sin puntuación, con espacios en los bordes para buscar palabras completas. */
function normalize(text: string): string {
  const plain = text
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
  return ` ${plain} `;
}

const INTEREST_WORDS: Record<string, string[]> = {
  travel: ['travel', 'travels', 'traveling', 'travelling', 'trips', 'viaje', 'viajes', 'viajar', 'voyage', 'voyages', 'voyager', 'reisen', 'reise'],
  business: ['business', 'negocio', 'negocios', 'emprender', 'affaires', 'business', 'wirtschaft', 'geschaft', 'geschafte'],
  music: ['music', 'musica', 'musique', 'musik', 'canciones', 'songs'],
  film: ['film', 'films', 'movie', 'movies', 'series', 'tv', 'cine', 'peliculas', 'pelis', 'pelicula', 'cinema', 'filme', 'serien', 'kino'],
  games: ['games', 'gaming', 'video games', 'videogames', 'videojuegos', 'video juegos', 'juegos', 'jeux video', 'jeux', 'videospiele', 'spiele', 'gamer'],
  culture: ['culture', 'cultura', 'kultur', 'art', 'arte', 'historia', 'history', 'histoire', 'geschichte'],
  food: ['food', 'cooking', 'cuisine', 'comida', 'cocina', 'cocinar', 'gastronomia', 'nourriture', 'essen', 'kochen'],
  sports: ['sports', 'sport', 'deportes', 'deporte', 'futbol', 'football', 'soccer', 'fussball'],
  literature: ['literature', 'books', 'reading', 'literatura', 'libros', 'leer', 'lectura', 'litterature', 'livres', 'lecture', 'literatur', 'bucher', 'lesen'],
  tech: ['tech', 'technology', 'tecnologia', 'technologie', 'programming', 'programacion', 'computadoras', 'informatica', 'informatique', 'technik'],
};

const LANGUAGE_WORDS: Record<string, string[]> = {
  en: ['english', 'ingles', 'anglais', 'englisch', 'eigo'],
  fr: ['french', 'frances', 'francais', 'franzosisch', 'furansugo'],
  de: ['german', 'aleman', 'allemand', 'deutsch', 'doitsugo'],
  es: ['spanish', 'espanol', 'castellano', 'espagnol', 'spanisch', 'supeingo'],
  ja: ['japanese', 'japones', 'japonais', 'japanisch', 'nihongo', '日本語'],
};

/** [CEFR, JLPT, palabras] — el orden es de menor a mayor nivel. */
const LEVEL_WORDS: [string, string, string[]][] = [
  ['A1', 'N5', ['a1', 'n5', 'beginner', 'principiante', 'debutant', 'anfanger', 'nada', 'cero', 'nothing', 'zero', 'rien', 'nichts', 'desde cero', 'from scratch']],
  ['A2', 'N4', ['a2', 'n4', 'basic', 'elementary', 'basico', 'poco', 'un poco', 'a little', 'elementaire', 'un peu', 'grundkenntnisse', 'ein bisschen']],
  ['B1', 'N3', ['b1', 'n3', 'intermediate', 'intermedio', 'intermediaire', 'mittelstufe', 'medio', 'regular']],
  ['B2', 'N2', ['b2', 'n2', 'upper intermediate', 'intermedio alto', 'intermediaire avance', 'obere mittelstufe']],
  ['C1', 'N1', ['c1', 'n1', 'advanced', 'avanzado', 'avance', 'expert', 'experto', 'fortgeschritten', 'fluent', 'fluido', 'fluidez', 'nativo', 'courant', 'fliessend']],
];

const NO_INTERESTS = [' nada ', ' ninguno ', ' ninguna ', ' none ', ' nothing ', ' no se ', ' rien ', ' aucun ', ' nichts ', ' keine '];

/** Palabras de relleno que nunca son un nombre. */
const NOT_A_NAME = new Set([
  'hola', 'hi', 'hello', 'hey', 'bueno', 'ok', 'okay', 'si', 'yes', 'no', 'gracias', 'thanks', 'vale', 'claro',
  'bonjour', 'salut', 'oui', 'merci', 'hallo', 'ja', 'nein', 'danke', 'eh', 'este', 'pues', 'mmm', 'um', 'ah', 'well',
  'perfecto', 'genial', 'que', 'what', 'como', 'repite', 'sorry', 'perdon',
]);

/** Palabras frecuentes para adivinar el idioma cuando no lo nombran. */
const STOPWORDS: Record<string, string[]> = {
  es: ['el', 'la', 'los', 'las', 'que', 'quiero', 'hola', 'por', 'favor', 'porfa', 'gracias', 'prefiero', 'mejor', 'bueno', 'usar', 'yo', 'si', 'en', 'de', 'me', 'gustaria'],
  en: ['the', 'i', 'want', 'hello', 'hi', 'please', 'yes', 'prefer', 'would', 'like', 'use', 'it', 'my', 'is'],
  fr: ['je', 'le', 'les', 'bonjour', 'oui', 'merci', 'voudrais', 'veux', 'prefere', 'utiliser', 'moi', 'est', 'c'],
  de: ['ich', 'und', 'hallo', 'danke', 'mochte', 'bitte', 'die', 'der', 'das', 'auf', 'nutzen', 'bin', 'ist'],
};

interface Hit {
  id: string;
  index: number;
  length: number;
}

/** Todas las apariciones de palabras del diccionario; las frases largas ganan sobre las cortas. */
function findAll(dict: Record<string, string[]>, norm: string, raw: string): Hit[] {
  const candidates: Hit[] = [];
  for (const [id, words] of Object.entries(dict)) {
    for (const w of words) {
      const cjk = /[\u3040-\u30ff\u4e00-\u9faf]/.test(w);
      const haystack = cjk ? raw : norm;
      const needle = cjk ? w : ` ${w.toLowerCase()} `;
      let from = 0;
      for (;;) {
        const index = haystack.indexOf(needle, from);
        if (index === -1) break;
        // Sin los espacios de borde: dos palabras seguidas no deben "chocar".
        const pad = cjk ? 0 : 1;
        candidates.push({ id, index: index + pad, length: needle.length - 2 * pad });
        from = index + 1;
      }
    }
  }
  candidates.sort((a, b) => b.length - a.length);
  const taken: Hit[] = [];
  for (const c of candidates) {
    const overlaps = taken.some((t) => c.index < t.index + t.length && t.index < c.index + c.length);
    if (!overlaps) taken.push(c);
  }
  return taken.sort((a, b) => a.index - b.index);
}

function detectSpokenLanguage(norm: string, raw: string): string | null {
  if (/[぀-ヿ一-龯]/.test(raw)) return 'ja';
  const words = norm.trim().split(' ');
  let best: string | null = null;
  let bestScore = 0;
  let tie = false;
  for (const [lang, list] of Object.entries(STOPWORDS)) {
    const score = words.filter((w) => list.includes(w)).length;
    if (score > bestScore) {
      best = lang;
      bestScore = score;
      tie = false;
    } else if (score === bestScore && score > 0) {
      tie = true;
    }
  }
  return bestScore > 0 && !tie ? best : null;
}

const NAME_PATTERN =
  /(?:me llamo|mi nombre es|soy|my name is|i am|i'm|im|call me|je m'appelle|je m appelle|je suis|moi c'est|mon nom est|ich hei(?:ss|ß)e|ich bin|mein name ist)\s+([\p{L}'-]+)/iu;

function extractName(raw: string): string | null {
  const m = raw.match(NAME_PATTERN);
  let candidate = m?.[1];
  if (!candidate) {
    // Respuesta corta tipo "Gustavo" o "Gustavo González": la primera palabra.
    const words = raw.replace(/[^\p{L}\s'-]/gu, ' ').trim().split(/\s+/).filter(Boolean);
    if (words.length === 0 || words.length > 3) return null;
    candidate = words[0];
  }
  const key = normalize(candidate).trim();
  if (!key || NOT_A_NAME.has(key)) return null;
  // Si es una palabra del catálogo ("viajes", "inglés") no es un nombre.
  const n = ` ${key} `;
  for (const dict of [INTEREST_WORDS, LANGUAGE_WORDS]) {
    if (Object.values(dict).some((ws) => ws.includes(key))) return null;
  }
  if (LEVEL_WORDS.some(([, , ws]) => ws.includes(key)) || n.trim() === '') return null;
  const clean = candidate.slice(0, 40);
  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
}

function levelFor(languageId: string, cefr: string): string {
  if (languageId !== 'ja') return cefr;
  return JLPT[CEFR.indexOf(cefr)] ?? cefr;
}

// ------------------------------------------------------------ extracción

/**
 * Lee lo que dijo el usuario y devuelve qué campos del perfil se pueden llenar.
 * Se interpreta según la pregunta en curso (el primer campo que falta), pero
 * también recoge de paso datos inconfundibles: "quiero aprender francés, nivel
 * básico" llena idioma y nivel a la vez.
 */
export function extractAnswer(text: string, known: OnboardingKnown): ProfileUpdate {
  const raw = text.trim();
  if (!raw) return {};
  const norm = normalize(raw);
  const missing = missingFields(known);
  const current = missing[0];
  const update: ProfileUpdate = {};

  // 1. Idioma de la app: lo nombra ("en español") o se deduce del idioma en que habló.
  if (current === 'app_language') {
    const named = findAll(LANGUAGE_WORDS, norm, raw)[0]?.id;
    const lang = named ?? detectSpokenLanguage(norm, raw);
    if (lang) update.uiLanguage = lang;
    return update; // en esta respuesta los idiomas nombrados son de la app, no para aprender
  }

  // 2. Nombre: solo cuando es la pregunta en curso (un nombre no se reconoce por diccionario).
  if (current === 'name') {
    const name = extractName(raw);
    if (name) update.name = name;
  }

  // 3. Intereses.
  if (!known.interestsAnswered) {
    const ids = [...new Set(findAll(INTEREST_WORDS, norm, raw).map((h) => h.id))];
    if (ids.length) {
      update.interests = ids;
      update.interestsAnswered = true;
    } else if (current === 'interests' && NO_INTERESTS.some((w) => norm.includes(w))) {
      update.interests = [];
      update.interestsAnswered = true;
    }
  }

  // 4. Idiomas a aprender (se suman a los que ya dijo).
  const languageHits = findAll(LANGUAGE_WORDS, norm, raw);
  let languages = known.languages ?? [];
  const mentioned = languageHits.map((h) => h.id).filter((id) => !languages.some((l) => l.id === id));
  if (mentioned.length) {
    languages = [...languages, ...[...new Set(mentioned)].map((id) => ({ id, level: null }))];
    update.languages = languages;
  }

  // 5. Niveles para los idiomas que aún no lo tienen.
  const pending = languages.filter((l) => !l.level);
  const levelHits = findAll(
    Object.fromEntries(LEVEL_WORDS.map(([cefr, , words]) => [cefr, words])),
    norm,
    raw,
  );
  if (pending.length && levelHits.length) {
    const assigned = new Map<string, string>();
    const nearby = languageHits.filter((h) => pending.some((p) => p.id === h.id));
    if (nearby.length) {
      // "En inglés tengo nivel intermedio y en francés soy principiante": cada
      // nivel va al idioma de SU MISMA parte de la frase (se corta en "y", ",",
      // "pero"...). Antes se tomaba el idioma más cercano y aquí salía al revés.
      const cuts = [...norm.matchAll(/ (y|e|and|but|pero|et|mais|und|aber) |,|;/g)].map((m) => m.index ?? 0);
      const clauseOf = (index: number) => cuts.filter((c) => c < index).length;
      for (const lh of levelHits) {
        const same = nearby.filter((h) => clauseOf(h.index) === clauseOf(lh.index) && !assigned.has(h.id));
        if (same.length === 1) assigned.set(same[0].id, lh.id);
      }
      // Lo que no quedó claro por partes: al idioma libre más cercano.
      const gap = (a: Hit, b: Hit) =>
        Math.max(0, a.index - (b.index + b.length), b.index - (a.index + a.length));
      for (const lh of levelHits) {
        if ([...assigned.values()].filter((v) => v === lh.id).length) continue;
        const closest = nearby
          .filter((h) => !assigned.has(h.id))
          .sort((a, b) => gap(a, lh) - gap(b, lh))[0];
        if (closest) assigned.set(closest.id, lh.id);
      }
    } else {
      // Sin idioma mencionado: los niveles van en orden a los idiomas pendientes.
      pending.forEach((p, i) => {
        const lh = levelHits[i];
        if (lh) assigned.set(p.id, lh.id);
      });
    }
    if (assigned.size) {
      update.languages = languages.map((l) =>
        assigned.has(l.id) ? { id: l.id, level: levelFor(l.id, assigned.get(l.id)!) } : l,
      );
    }
  }

  return update;
}

export function isEmptyUpdate(u: ProfileUpdate): boolean {
  return Object.keys(u).length === 0;
}
