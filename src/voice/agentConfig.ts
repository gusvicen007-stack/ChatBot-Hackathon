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
  en: "Hi, I'm Sabio! Which language do you want the app in? English, Spanish, French, German or Japanese?",
  es: '¡Hola, soy Sabio! ¿En qué idioma quieres la app? Inglés, español, francés, alemán o japonés.',
  fr: "Bonjour, je suis Sabio ! Dans quelle langue veux-tu l'appli ? Anglais, espagnol, français, allemand ou japonais ?",
  de: 'Hallo, ich bin Sabio! In welcher Sprache möchtest du die App? Englisch, Spanisch, Französisch, Deutsch oder Japanisch?',
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
    interests: '¿Qué te interesa? Por ejemplo viajes, música o cine.',
    languages: '¿Qué idiomas quieres aprender?',
    levels: '¿Qué nivel tienes: principiante, intermedio o avanzado?',
    done: 'Ya tengo todo. Presiona el botón verde.',
  },
  en: {
    app_language: 'Which language do you want to use the app in?',
    name: "What's your name?",
    interests: 'What are you into? For example travel, music or movies.',
    languages: 'Which languages do you want to learn?',
    levels: "What's your level: beginner, intermediate or advanced?",
    done: 'I have everything. Press the green button.',
  },
  fr: {
    app_language: "Dans quelle langue veux-tu utiliser l'appli ?",
    name: "Comment tu t'appelles ?",
    interests: "Qu'est-ce qui t'intéresse ? Par exemple les voyages, la musique ou le cinéma.",
    languages: 'Quelles langues veux-tu apprendre ?',
    levels: 'Quel est ton niveau : débutant, intermédiaire ou avancé ?',
    done: "J'ai tout. Appuie sur le bouton vert.",
  },
  de: {
    app_language: 'In welcher Sprache möchtest du die App nutzen?',
    name: 'Wie heißt du?',
    interests: 'Was interessiert dich? Zum Beispiel Reisen, Musik oder Filme.',
    languages: 'Welche Sprachen möchtest du lernen?',
    levels: 'Wie ist dein Niveau: Anfänger, Mittelstufe oder fortgeschritten?',
    done: 'Ich habe alles. Drück den grünen Knopf.',
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
    `Your voice speaks ${lang}. Speak ONLY ${lang}. This is spoken aloud: keep every reply under 20 words.`,
    'Short turns matter: long replies make the user wait. Give at most 3 short examples when you ask something; NEVER read a full list of options.',
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
    '2. Their interests (the app knows: travel, business, music, film, video games, culture, food, sports, literature, technology). Several or none is fine.',
    '3. Which languages they want to learn (available: English, French, German, Spanish, Japanese; Italian is coming soon).',
    '4. For EACH chosen language, their current level (beginner, basic, intermediate, upper intermediate or advanced). Ask one language at a time.',
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
    '- When the student makes a clear mistake, correct ONLY the most important one, in one short sentence',
    '  (for example: "We say: ..."), then continue the conversation. Never lecture; the app shows the details on screen.',
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
          // Siempre se permite interrumpir. Sin esto (probado con audio real),
          // si el usuario contesta mientras Sabio aún habla, AssemblyAI DESCARTA
          // su respuesta: Sabio queda esperando y el registro se "traba".
          interrupt_response: true,
          // Hay que hablar 600 ms seguidos para cortar a Sabio: un "ajá" o el
          // eco de su propia voz por las bocinas no alcanzan.
          interruption_delay: 600,
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
