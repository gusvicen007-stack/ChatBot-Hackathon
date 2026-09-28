export const THEMES = [
  'greetings',
  'family',
  'food',
  'time',
  'city',
  'shopping',
  'health',
  'leisure',
  'travel',
  'work',
  'feelings',
  'discourse',
] as const;

export type Theme = (typeof THEMES)[number];

/** Texto para el alumno: español e inglés (los demás idiomas de la app usan el inglés). */
export interface Gloss {
  es: string;
  en: string;
}

export interface Flashcard {
  /** La palabra o frase en el idioma que se aprende. */
  term: string;
  /** Lectura en romaji (solo japonés). */
  reading?: string;
  meaning: Gloss;
  /** Frase de ejemplo en el idioma que se aprende. */
  example: string;
  /** Tip de uso o para recordarla. */
  tip?: Gloss;
  /** Solo en correcciones de la clase: lo que dijo el alumno (mal). */
  wrong?: string;
}

export interface LanguageTip {
  title: Gloss;
  body: Gloss;
}

export interface LanguageDeck {
  cards: Record<Theme, Flashcard[]>;
  tips: LanguageTip[];
}

/** Atajo para escribir las tarjetas en una línea: [término, significado es, en, ejemplo, tip es?, tip en?, lectura?]. */
export type CardRow = [
  term: string,
  es: string,
  en: string,
  example: string,
  tipEs?: string,
  tipEn?: string,
  reading?: string,
];

export function card(row: CardRow): Flashcard {
  const [term, es, en, example, tipEs, tipEn, reading] = row;
  return {
    term,
    reading,
    meaning: { es, en },
    example,
    tip: tipEs && tipEn ? { es: tipEs, en: tipEn } : undefined,
  };
}

export function deck(
  rows: Record<Theme, CardRow[]>,
  tips: [titleEs: string, titleEn: string, bodyEs: string, bodyEn: string][],
): LanguageDeck {
  return {
    cards: Object.fromEntries(
      Object.entries(rows).map(([theme, list]) => [theme, list.map(card)]),
    ) as Record<Theme, Flashcard[]>,
    tips: tips.map(([te, tn, be, bn]) => ({ title: { es: te, en: tn }, body: { es: be, en: bn } })),
  };
}
