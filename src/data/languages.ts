import type { LanguageOption } from '../types';

/** Ids estables — las etiquetas se resuelven vía i18n/translations.ts (`interests.<id>`). */
export const interestOptions = [
  'travel',
  'business',
  'music',
  'film',
  'games',
  'culture',
  'food',
  'sports',
  'literature',
  'tech',
] as const;

export const languageOptions: LanguageOption[] = [
  {
    id: 'en',
    name: 'Inglés',
    selfName: 'English',
    flag: '🇺🇸',
    color: 'var(--color-brand-500)',
    levelSystem: 'CEFR',
    levels: [
      { code: 'A1', label: 'A1 · Principiante', description: 'Frases y expresiones básicas' },
      { code: 'A2', label: 'A2 · Básico', description: 'Conversaciones simples del día a día' },
      { code: 'B1', label: 'B1 · Intermedio', description: 'Te desenvuelves solo viajando' },
      { code: 'B2', label: 'B2 · Intermedio alto', description: 'Fluidez en temas variados' },
      { code: 'C1', label: 'C1 · Avanzado', description: 'Dominio casi nativo' },
    ],
  },
  {
    id: 'fr',
    name: 'Francés',
    selfName: 'Français',
    flag: '🇫🇷',
    color: 'var(--color-coral-500)',
    levelSystem: 'CEFR',
    levels: [
      { code: 'A1', label: 'A1 · Principiante', description: 'Frases y expresiones básicas' },
      { code: 'A2', label: 'A2 · Básico', description: 'Conversaciones simples del día a día' },
      { code: 'B1', label: 'B1 · Intermedio', description: 'Te desenvuelves solo viajando' },
      { code: 'B2', label: 'B2 · Intermedio alto', description: 'Fluidez en temas variados' },
      { code: 'C1', label: 'C1 · Avanzado', description: 'Dominio casi nativo' },
    ],
  },
  {
    id: 'ja',
    name: 'Japonés',
    selfName: '日本語',
    flag: '🇯🇵',
    color: 'var(--color-mint-500)',
    levelSystem: 'JLPT',
    levels: [
      { code: 'N5', label: 'N5 · Principiante', description: 'Hiragana y frases básicas' },
      { code: 'N4', label: 'N4 · Básico', description: 'Conversaciones cotidianas' },
      { code: 'N3', label: 'N3 · Intermedio', description: 'Te desenvuelves solo viajando' },
      { code: 'N2', label: 'N2 · Intermedio alto', description: 'Fluidez en temas variados' },
      { code: 'N1', label: 'N1 · Avanzado', description: 'Dominio casi nativo' },
    ],
  },
  {
    id: 'es',
    name: 'Español',
    selfName: 'Español',
    flag: '🇪🇸',
    color: 'var(--color-violet-500)',
    levelSystem: 'CEFR',
    levels: [
      { code: 'A1', label: 'A1 · Principiante', description: 'Frases y expresiones básicas' },
      { code: 'A2', label: 'A2 · Básico', description: 'Conversaciones simples del día a día' },
      { code: 'B1', label: 'B1 · Intermedio', description: 'Te desenvuelves solo viajando' },
      { code: 'B2', label: 'B2 · Intermedio alto', description: 'Fluidez en temas variados' },
      { code: 'C1', label: 'C1 · Avanzado', description: 'Dominio casi nativo' },
    ],
  },
  {
    id: 'de',
    name: 'Alemán',
    selfName: 'Deutsch',
    flag: '🇩🇪',
    color: 'var(--color-amber-500)',
    levelSystem: 'CEFR',
    levels: [
      { code: 'A1', label: 'A1 · Principiante', description: 'Frases y expresiones básicas' },
      { code: 'A2', label: 'A2 · Básico', description: 'Conversaciones simples del día a día' },
      { code: 'B1', label: 'B1 · Intermedio', description: 'Te desenvuelves solo viajando' },
      { code: 'B2', label: 'B2 · Intermedio alto', description: 'Fluidez en temas variados' },
      { code: 'C1', label: 'C1 · Avanzado', description: 'Dominio casi nativo' },
    ],
  },
  {
    id: 'it',
    name: 'Italiano',
    selfName: 'Italiano',
    flag: '🇮🇹',
    color: 'var(--color-coral-500)',
    levelSystem: 'CEFR',
    levels: [],
    comingSoon: true,
  },
];

/** Idiomas que se pueden elegir como idioma de interfaz (excluye "próximamente"). */
export const uiLanguageOptions = languageOptions.filter((l) => !l.comingSoon);

export function getLanguage(id: string) {
  return languageOptions.find((l) => l.id === id);
}
