/**
 * Voces, prompts y configuracion de sesion del tutor.
 *
 * Nota de producto: AssemblyAI ENTIENDE 18 idiomas pero solo HABLA 6
 * (ingles, espanol, frances, aleman, italiano, portugues). El japones se
 * transcribe perfecto pero no tiene voz, asi que no puede tener tutor hablado.
 */

export const VOICE: Record<string, string | null> = {
  es: 'lola',      // acento peninsular, la unica voz en espanol
  en: 'alba',      // ingles estadounidense
  fr: 'estelle',
  de: 'juergen',
  it: 'giovanni',
  ja: null,        // sin voz disponible
};

export function canSpeak(langId: string): boolean {
  return Boolean(VOICE[langId]);
}

/** Como se llama cada idioma, para escribirlo dentro del prompt. */
const NAME: Record<string, string> = {
  es: 'Spanish', en: 'English', fr: 'French',
  de: 'German', it: 'Italian', ja: 'Japanese',
};

/** El tutor abre la conversacion. Sin esto se queda mudo esperando al alumno. */
const GREETING: Record<string, string> = {
  es: '\u00a1Hola! \u00bfC\u00f3mo est\u00e1s hoy?',
  en: 'Hi there! How are you doing today?',
  fr: 'Bonjour ! Comment \u00e7a va aujourd\u0027hui ?',
  de: 'Hallo! Wie geht es dir heute?',
  it: 'Ciao! Come stai oggi?',
};

/** Guia de registro por nivel. Cubre MCER y JLPT. */
const LEVEL_GUIDE: Record<string, string> = {
  A1: 'Absolute beginner. Use only present tense and the 500 most common words. Sentences under 8 words. Speak slowly. One question at a time.',
  A2: 'Basic. Simple past and future are fine. Everyday topics. Sentences under 12 words.',
  B1: 'Intermediate. Connected speech, opinions, reasons. Normal pace.',
  B2: 'Upper intermediate. Nuance and some idioms. Natural pace.',
  C1: 'Advanced. Fully natural, idiomatic, challenge them.',
  N5: 'Absolute beginner. Very short sentences, high-frequency vocabulary only.',
  N4: 'Basic. Everyday conversation, simple structures.',
  N3: 'Intermediate. Connected speech at a normal pace.',
  N2: 'Upper intermediate. Nuance and common idioms.',
  N1: 'Advanced. Fully natural and idiomatic.',
};

/**
 * Paciencia por nivel: cuanto silencio esperamos antes de dar por terminado
 * el turno del alumno.
 *
 * Esto es el corazon del producto. Un principiante hace pausas largas
 * buscando la palabra, y un agente con ventana fija lo atropella justo
 * cuando estaba a punto de acertar. Le damos mas del triple de aire que
 * a un avanzado.
 */
const PATIENCE: Record<string, { min: number; max: number }> = {
  A1: { min: 1200, max: 3000 },
  A2: { min: 1000, max: 2600 },
  B1: { min: 700,  max: 2200 },
  B2: { min: 500,  max: 1800 },
  C1: { min: 350,  max: 1400 },
  N5: { min: 1200, max: 3000 },
  N4: { min: 1000, max: 2600 },
  N3: { min: 700,  max: 2200 },
  N2: { min: 500,  max: 1800 },
  N1: { min: 350,  max: 1400 },
};

export function patienceFor(level: string) {
  return PATIENCE[level] ?? PATIENCE.A2;
}

export interface SessionOpts {
  targetLang: string;
  nativeLang: string;
  level: string;
  topic?: string;
  /** false cuando retomamos tras un cambio de voz: no queremos que vuelva a saludar. */
  greet?: boolean;
  /** Habla en el idioma nativo del alumno (modo rescate). */
  rescue?: boolean;
}

function tutorPrompt(o: SessionOpts): string {
  const target = NAME[o.targetLang] ?? o.targetLang;
  const native = NAME[o.nativeLang] ?? o.nativeLang;
  const guide = LEVEL_GUIDE[o.level] ?? LEVEL_GUIDE.A2;

  if (o.rescue) {
    return [
      `You are a warm language tutor. The student is learning ${target} and got stuck.`,
      `Speak ONLY ${native} right now. Explain briefly what they were trying to say,`,
      `give them the ${target} phrase they need, and invite them to try it again.`,
      'Keep it under 40 words. This is spoken aloud.',
    ].join(' ');
  }

  return [
    `You are a warm, patient conversation tutor. The student's native language is ${native}.`,
    `Speak ONLY ${target}. Never switch to ${native}, even if the student does.`,
    `Level: ${o.level}. ${guide}`,
    o.topic ? `Today's topic: ${o.topic}.` : '',
    '',
    'HOW TO TEACH:',
    '- Keep every reply under 30 words. It is spoken aloud, not read.',
    '- Ask ONE question, then stop and wait. Do not stack questions.',
    '- Do not correct every mistake. Recast: repeat their idea correctly and move on.',
    '- If they go silent, wait. Then offer a simpler version of the question.',
    '- If they say they do not understand, rephrase more simply in ' + target + '.',
    '- Praise specifically ("good use of the past tense"), never generically.',
    '- You are a conversation partner, not a quiz. Let them lead when they want to.',
  ].filter(Boolean).join('\n');
}

export function buildSession(o: SessionOpts) {
  const lang = o.rescue ? o.nativeLang : o.targetLang;
  const voice = VOICE[lang];
  if (!voice) throw new Error(`No hay voz disponible para "${lang}"`);

  const pace = patienceFor(o.level);

  return {
    type: 'session.update',
    session: {
      system_prompt: tutorPrompt(o),
      greeting: o.greet === false ? '' : (GREETING[lang] ?? ''),
      input: {
        format: { encoding: 'audio/pcm', sample_rate: 24000 },
        // language_codes se OMITE a proposito: la deteccion automatica nos
        // deja ver en que idioma hablo el alumno, que es lo que dispara el
        // rescate cuando se pasa a su idioma nativo.
        turn_detection: {
          vad_threshold: 0.3,
          min_silence: pace.min,
          max_silence: pace.max,
          interrupt_response: true,
          interruption_delay: 100,
        },
      },
      output: {
        voice,
        format: { encoding: 'audio/pcm', sample_rate: 24000 },
        volume: 100,
      },
      tools: [],
    },
  };
}
