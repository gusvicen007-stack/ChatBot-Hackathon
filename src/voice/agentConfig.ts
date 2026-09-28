/**
 * Voces, prompts y configuracion de sesion del tutor.
 *
 * Nota de producto: AssemblyAI ENTIENDE 18 idiomas pero solo HABLA 6
 * (ingles, espanol, frances, aleman, italiano, portugues). El japones se
 * transcribe perfecto pero no tiene voz, asi que no puede tener tutor hablado.
 */

import { missingFields, type MissingField, type OnboardingKnown } from './onboarding';

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

/** Al retomar una clase: no vuelve a preguntar "¿cómo estás?". */
const RESUME_GREETING: Record<string, string> = {
  es: '\u00a1Sigamos donde \u00edbamos!',
  en: "Let's pick up where we left off!",
  fr: 'Reprenons o\u00f9 on en \u00e9tait !',
  de: 'Machen wir weiter, wo wir aufgeh\u00f6rt haben!',
  it: 'Riprendiamo da dove eravamo!',
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
  /** 'onboarding' = Sabio guía el registro en vez de dar clase. */
  mode?: 'tutor' | 'onboarding';
  /** Solo en onboarding: lo que ya sabemos del alumno, para no volver a preguntarlo. */
  known?: OnboardingKnown;
  /** Solo en onboarding: la sesión se abre porque se detectó/cambió el idioma. */
  switched?: boolean;
  targetLang: string;
  nativeLang: string;
  level: string;
  topic?: string;
  /** false cuando retomamos tras un cambio de voz: no queremos que vuelva a saludar. */
  greet?: boolean;
  /** Habla en el idioma nativo del alumno (modo rescate). */
  rescue?: boolean;
  /** Retoma una clase ya empezada (tras pausa o límite de tiempo): saluda distinto. */
  resume?: boolean;
}

/**
 * Saludo inicial del registro. La app arranca en inglés: Sabio se presenta y
 * pide elegir el idioma de la app (si contestan en otro idioma, se usa ese).
 */
const CHOOSE_GREETING: Record<string, string> = {
  en: "Hi! I'm Sabio, and I'll help you create your account. Which language would you like to use the app in? English, Spanish, French, German or Japanese?",
  es: '¡Hola! Soy Sabio y te ayudo a crear tu cuenta. ¿En qué idioma quieres usar la app? Inglés, español, francés, alemán o japonés.',
  fr: "Bonjour ! Je suis Sabio et je t'aide à créer ton compte. Dans quelle langue veux-tu utiliser l'appli ? Anglais, espagnol, français, allemand ou japonais ?",
  de: 'Hallo! Ich bin Sabio und helfe dir, dein Konto zu erstellen. In welcher Sprache möchtest du die App nutzen? Englisch, Spanisch, Französisch, Deutsch oder Japanisch?',
};

/** Frase de enlace al abrir la sesión en el idioma detectado, o al retomar tras una pausa. */
const SWITCHED: Record<string, string> = {
  es: '¡Perfecto, seguimos en español!',
  en: "Perfect, let's continue in English!",
  fr: 'Parfait, on continue en français !',
  de: 'Perfekt, wir machen auf Deutsch weiter!',
};
const RESUMED: Record<string, string> = {
  es: '¡Aquí estoy de nuevo!',
  en: "I'm back!",
  fr: 'Me revoilà !',
  de: 'Da bin ich wieder!',
};

/** La siguiente pregunta del registro, para que el saludo ya la haga. */
const NEXT_QUESTION: Record<string, Record<MissingField | 'done', string>> = {
  es: {
    app_language: '¿En qué idioma quieres usar la app?',
    name: '¿Cómo te llamas?',
    interests: '¿Qué te interesa? Por ejemplo viajes, música, cine, videojuegos o comida.',
    languages: '¿Qué idiomas quieres aprender? Tengo inglés, francés, alemán, español y japonés.',
    levels: '¿Qué nivel tienes: principiante, básico, intermedio, intermedio alto o avanzado?',
    done: 'Ya tengo todo. Presiona el botón verde, Comenzar mi aventura.',
  },
  en: {
    app_language: 'Which language do you want to use the app in?',
    name: "What's your name?",
    interests: 'What are you into? For example travel, music, movies, video games or food.',
    languages: 'Which languages do you want to learn? I have English, French, German, Spanish and Japanese.',
    levels: "What's your level: beginner, basic, intermediate, upper intermediate or advanced?",
    done: 'I have everything. Press the green button, Start my adventure.',
  },
  fr: {
    app_language: "Dans quelle langue veux-tu utiliser l'appli ?",
    name: "Comment tu t'appelles ?",
    interests: "Qu'est-ce qui t'intéresse ? Par exemple les voyages, la musique, le cinéma, les jeux vidéo ou la cuisine.",
    languages: "Quelles langues veux-tu apprendre ? J'ai l'anglais, le français, l'allemand, l'espagnol et le japonais.",
    levels: 'Quel est ton niveau : débutant, élémentaire, intermédiaire, avancé ou expert ?',
    done: "J'ai tout. Appuie sur le bouton vert, Commencer mon aventure.",
  },
  de: {
    app_language: 'In welcher Sprache möchtest du die App nutzen?',
    name: 'Wie heißt du?',
    interests: 'Was interessiert dich? Zum Beispiel Reisen, Musik, Filme, Videospiele oder Essen.',
    languages: 'Welche Sprachen möchtest du lernen? Ich habe Englisch, Französisch, Deutsch, Spanisch und Japanisch.',
    levels: 'Wie ist dein Niveau: Anfänger, Grundkenntnisse, Mittelstufe, obere Mittelstufe oder fortgeschritten?',
    done: 'Ich habe alles. Drück den grünen Knopf, Mein Abenteuer beginnen.',
  },
};

function onboardingGreeting(lang: string, known: OnboardingKnown | undefined, switched: boolean): string {
  if (!known?.uiLanguage) return CHOOSE_GREETING[lang] ?? CHOOSE_GREETING.en;
  const next = missingFields(known).find((f) => f !== 'app_language') ?? 'done';
  const questions = NEXT_QUESTION[lang] ?? NEXT_QUESTION.en;
  const lead = (switched ? SWITCHED : RESUMED)[lang] ?? '';
  return `${lead} ${questions[next]}`.trim();
}

function describeKnown(k: OnboardingKnown | undefined): string {
  if (!k) return 'Nothing yet.';
  const lines = [
    k.uiLanguage ? `- App language: ${NAME[k.uiLanguage] ?? k.uiLanguage}` : '',
    k.name ? `- Name: ${k.name}` : '',
    k.interestsAnswered ? `- Interests: ${k.interests?.length ? k.interests.join(', ') : 'none'}` : '',
    ...(k.languages ?? []).map(
      (l) => `- Wants to learn ${NAME[l.id] ?? l.id}${l.level ? `, level ${l.level}` : ' (level still unknown)'}`,
    ),
  ].filter(Boolean);
  return lines.length ? lines.join('\n') : 'Nothing yet.';
}

const MISSING_LABEL: Record<MissingField, string> = {
  app_language: 'the app language',
  name: 'their first name',
  interests: 'their interests',
  languages: 'which languages they want to learn',
  levels: 'their level in each chosen language that has no level yet',
};

/**
 * El prompt del registro. La app lo vuelve a mandar (session.update) cada vez
 * que entiende una respuesta, así Sabio siempre sabe qué ya está guardado y
 * qué falta preguntar.
 */
export function onboardingPrompt(o: SessionOpts): string {
  const lang = NAME[o.targetLang] ?? o.targetLang;
  const detecting = !o.known?.uiLanguage;
  const missing = missingFields(o.known ?? {});
  return [
    'You are Sabio, a friendly wizard owl who guides new users through signing up for Fluenta, a language-learning app.',
    `Your voice speaks ${lang}. Speak ONLY ${lang}. This is spoken aloud: keep every reply under 25 words.`,
    '',
    detecting
      ? [
          'STEP 0 — APP LANGUAGE. You already greeted the user and asked which language they want to use the app in.',
          'Wait for their answer. The app switches to that language automatically: do not ask anything else yet.',
          '',
        ].join('\n')
      : '',
    'Then collect, IN THIS ORDER, asking ONE thing per turn and waiting for the answer:',
    '1. Their first name.',
    '2. Their interests. Options: travel, business, music, film and series, video games, culture, food, sports, literature, technology. Several or none is fine.',
    '3. Which languages they want to learn. Options: English, French, German, Spanish, Japanese. Italian is coming soon and cannot be chosen yet.',
    '4. For EACH chosen language, their current level: beginner, basic, intermediate, upper intermediate or advanced.',
    '',
    'ALREADY SAVED by the app (never ask these again):',
    describeKnown(o.known),
    '',
    missing.length
      ? `STILL MISSING: ${missing.map((m) => MISSING_LABEL[m]).join('; ')}. Ask about the first one.`
      : 'EVERYTHING IS SAVED. Give a one-sentence summary and tell them to press the green button on the screen. Do not ask anything else.',
    '- Never say the green button is available while something is still missing.',
    '- If they already answered something that is still listed as missing, the app did not catch it: ask it again briefly and clearly.',
    '',
    'RULES:',
    '- Briefly acknowledge each answer using their words ("Great, travel and music!"), then ask the next item.',
    '- If an answer is unclear or not one of the options, gently offer the options again.',
    '- Do not teach, quiz or correct grammar. This is only the sign-up.',
  ].filter(Boolean).join('\n');
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

  const onboarding = o.mode === 'onboarding';
  const pace = patienceFor(o.level);
  const greeting = onboarding
    ? onboardingGreeting(lang, o.known, Boolean(o.switched))
    : o.resume
      ? RESUME_GREETING[lang]
      : GREETING[lang];

  return {
    type: 'session.update',
    session: {
      system_prompt: onboarding ? onboardingPrompt(o) : tutorPrompt(o),
      greeting: o.greet === false ? '' : (greeting ?? ''),
      input: {
        format: { encoding: 'audio/pcm', sample_rate: 24000 },
        // language_codes se OMITE a proposito: la deteccion automatica nos
        // deja ver en que idioma hablo el alumno, que es lo que dispara el
        // rescate cuando se pasa a su idioma nativo.
        turn_detection: {
          // 0.5 es el default. Mas bajo (antes 0.3) captaba la propia voz del
          // tutor por las bocinas y se interrumpia solo: se oia entrecortado.
          vad_threshold: 0.5,
          // En clase fijamos la paciencia por nivel. En el registro se deja que
          // AssemblyAI la ajuste solo: fijarla desactiva su ritmo adaptativo y
          // hacía que cada respuesta tardara de más.
          ...(onboarding ? {} : { min_silence: pace.min, max_silence: pace.max }),
          // En el registro no se permite interrumpir: con bocinas, el eco de la
          // propia voz de Sabio lo cortaba al empezar y dejaba respuestas a medias.
          interrupt_response: !onboarding,
          // 500 ms = modo 'balanced': un "ajá" o un eco breve ya no corta al tutor.
          interruption_delay: 500,
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
