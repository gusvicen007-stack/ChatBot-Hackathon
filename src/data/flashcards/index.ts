import de from './de';
import en from './en';
import es from './es';
import fr from './fr';
import ja from './ja';
import type { Gloss, LanguageDeck, Theme } from './types';

export { THEMES, type Flashcard, type LanguageTip, type Theme } from './types';

const DECKS: Record<string, LanguageDeck> = { en, fr, de, es, ja };

export function getDeck(languageId: string): LanguageDeck | null {
  return DECKS[languageId] ?? null;
}

/** Texto en el idioma de la app: español o inglés (los demás idiomas usan inglés). */
export function gloss(g: Gloss, uiLang: string): string {
  return uiLang === 'es' ? g.es : g.en;
}

/**
 * Palabras clave para ligar un tema del temario (títulos en varios idiomas)
 * con un mazo. El orden importa: gana el primero que coincide.
 */
const THEME_KEYWORDS: [Theme, string[]][] = [
  ['work', ['trabajo', 'travail', 'arbeit', '職場', 'laboral', 'negocio', 'business', 'ビジネス', 'profesional', 'reunion', 'negociacion', 'estudio', 'escolar', '学校', 'educacion', 'telefon', 'korrespondenz', 'empleo', 'economia']],
  ['travel', ['viaje', 'voyage', 'reise', '旅行', 'turismo']],
  ['greetings', ['saludar', 'saludo', 'presentarte', 'datos personales', 'entrer en contact', 'vorstellen', 'persönliche', 'personliche', 'info personal', 'あいさつ']],
  ['family', ['familia', 'famille', 'familie', '家族', 'amigos']],
  ['food', ['comida', 'bebida', 'alimentation', 'essen', '食べ物', 'restaurante']],
  ['shopping', ['compras', 'ropa', 'vetements', 'courses', 'einkauf', '買い物']],
  ['health', ['salud', 'cuerpo', 'sante', 'gesundheit', '健康', 'bienestar']],
  ['city', ['lugares', 'direcciones', 'ville', 'stadt', 'barrio', '道案内', 'casa', 'wohnen', 'transporte']],
  ['time', ['numero', 'nombres', 'hora', 'heure', 'horaire', 'zahlen', 'tagesablauf', '数字', '時間', 'clima', 'meteo', 'saison', 'wetter', 'colores', '色', '曜日', 'rutina', 'vida diaria', '毎日', 'compter']],
  ['leisure', ['tiempo libre', 'hobbies', 'hobbys', '趣味', 'ocio', 'freizeit', 'pasatiempo', 'reseaux sociaux', 'redes sociales', 'tecnologia en el dia', 'arte y cine']],
  ['feelings', ['opinar', 'opinion', 'sentimiento', 'emocion', '感情', 'meinung', 'justificar']],
];

function plain(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
}

/** El mazo que corresponde al tema de la clase; si no hay pista, uno acorde al nivel. */
export function themeForTopic(topic: string | undefined, levelCode: string): Theme {
  const text = plain(topic ?? '');
  // La palabra clave debe empezar una palabra ("ocio" no cuenta dentro de
  // "emociones", ni "zahlen" dentro de "erzählen"). Kanji/kana: sin límites.
  const matches = (w: string) => {
    const k = plain(w);
    if (/[\u3040-\u30ff\u4e00-\u9faf]/.test(k)) return text.includes(k);
    return new RegExp(`(^|[^\\p{L}])${k}`, 'u').test(text);
  };
  for (const [theme, words] of THEME_KEYWORDS) {
    if (words.some(matches)) return theme;
  }
  if (['A1', 'N5'].includes(levelCode)) return 'greetings';
  if (['A2', 'N4'].includes(levelCode)) return 'time';
  if (['B1', 'N3'].includes(levelCode)) return 'feelings';
  return 'discourse';
}

/** Código de voz para leer la tarjeta en voz alta con el navegador. */
export const SPEECH_LANG: Record<string, string> = {
  en: 'en-US',
  fr: 'fr-FR',
  de: 'de-DE',
  es: 'es-ES',
  ja: 'ja-JP',
};
