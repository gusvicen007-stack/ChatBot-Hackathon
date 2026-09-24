import type { LanguageOption, LevelOption } from '../types';
import type { UILang } from './translations';

/** Nombre de cada idioma de curso (en, fr, ja, es, de, it), según el idioma de interfaz. */
const LANGUAGE_NAMES: Record<string, Record<UILang, string>> = {
  en: { es: 'Inglés', en: 'English', fr: 'Anglais', ja: '英語', de: 'Englisch' },
  fr: { es: 'Francés', en: 'French', fr: 'Français', ja: 'フランス語', de: 'Französisch' },
  ja: { es: 'Japonés', en: 'Japanese', fr: 'Japonais', ja: '日本語', de: 'Japanisch' },
  es: { es: 'Español', en: 'Spanish', fr: 'Espagnol', ja: 'スペイン語', de: 'Spanisch' },
  de: { es: 'Alemán', en: 'German', fr: 'Allemand', ja: 'ドイツ語', de: 'Deutsch' },
  it: { es: 'Italiano', en: 'Italian', fr: 'Italien', ja: 'イタリア語', de: 'Italienisch' },
};

export function getLanguageName(languageId: string, uiLang: UILang): string {
  return LANGUAGE_NAMES[languageId]?.[uiLang] ?? LANGUAGE_NAMES[languageId]?.es ?? languageId;
}

/** Descriptor corto por posición de nivel (0 = más bajo … 4 = más alto), común a CEFR y JLPT. */
const LEVEL_DESCRIPTORS: Record<UILang, string[]> = {
  es: ['Principiante', 'Básico', 'Intermedio', 'Intermedio alto', 'Avanzado'],
  en: ['Beginner', 'Basic', 'Intermediate', 'Upper intermediate', 'Advanced'],
  fr: ['Débutant', 'Élémentaire', 'Intermédiaire', 'Intermédiaire avancé', 'Avancé'],
  ja: ['初級', '初中級', '中級', '中上級', '上級'],
  de: ['Anfänger', 'Grundkenntnisse', 'Mittelstufe', 'Obere Mittelstufe', 'Fortgeschritten'],
};

/** Descripción larga por posición de nivel — igual para CEFR; el nivel 0 de JLPT tiene su propio texto. */
const LEVEL_DESCRIPTIONS: Record<UILang, string[]> = {
  es: [
    'Frases y expresiones básicas',
    'Conversaciones simples del día a día',
    'Te desenvuelves solo viajando',
    'Fluidez en temas variados',
    'Dominio casi nativo',
  ],
  en: [
    'Basic phrases and expressions',
    'Simple everyday conversations',
    'You can get by travelling alone',
    'Fluent across a range of topics',
    'Near-native command',
  ],
  fr: [
    'Phrases et expressions de base',
    'Conversations simples du quotidien',
    'Tu te débrouilles seul en voyage',
    'Aisance sur des sujets variés',
    'Maîtrise quasi native',
  ],
  ja: [
    '基本的なフレーズと表現',
    '日常の簡単な会話',
    '一人旅で困らないレベル',
    '幅広い話題を流暢に話せる',
    'ネイティブに近いレベル',
  ],
  de: [
    'Grundlegende Sätze und Ausdrücke',
    'Einfache Alltagsgespräche',
    'Du kommst allein auf Reisen zurecht',
    'Flüssig zu vielen Themen',
    'Nahezu muttersprachliches Niveau',
  ],
};

const JLPT_FIRST_LEVEL_DESCRIPTION: Record<UILang, string> = {
  es: 'Hiragana y frases básicas',
  en: 'Hiragana and basic phrases',
  fr: 'Hiragana et phrases de base',
  ja: 'ひらがなと基本的なフレーズ',
  de: 'Hiragana und einfache Sätze',
};

/** Devuelve los niveles de `language` con `label`/`description` en el idioma de interfaz dado. */
export function getLocalizedLevels(language: LanguageOption, uiLang: UILang): LevelOption[] {
  const descriptors = LEVEL_DESCRIPTORS[uiLang];
  const descriptions = LEVEL_DESCRIPTIONS[uiLang];
  return language.levels.map((level, i) => ({
    code: level.code,
    label: `${level.code} · ${descriptors[i] ?? descriptors[descriptors.length - 1]}`,
    description:
      language.levelSystem === 'JLPT' && i === 0
        ? JLPT_FIRST_LEVEL_DESCRIPTION[uiLang]
        : (descriptions[i] ?? descriptions[descriptions.length - 1]),
  }));
}
