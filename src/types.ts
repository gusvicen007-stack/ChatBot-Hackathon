export interface Course {
  id: string;
  language: string;
  flag: string;
  level: string;
  /** Nivel en el que va el alumno dentro del mapa (sube al completar un nivel). */
  levelCode: string;
  progress: number;
  lessonsDone: number;
  lessonsTotal: number;
  color: string;
  nextTopic: string;
  nextTopicId: string | null;
}

export interface ChatMessage {
  id: string;
  role: 'tutor' | 'student';
  text: string;
  timestamp: string;
}

export interface LevelOption {
  code: string;
  label: string;
  description: string;
}

export interface LanguageOption {
  id: string;
  name: string;
  /** Nombre del idioma en sí mismo (p. ej. "English", "日本語"), para el selector de idioma materno. */
  selfName: string;
  flag: string;
  color: string;
  levelSystem: 'CEFR' | 'JLPT';
  levels: LevelOption[];
  comingSoon?: boolean;
}

export interface Topic {
  id: string;
  title: string;
  description: string;
}

export interface SelectedLanguage {
  languageId: string;
  levelCode: string;
}

export interface StudentProfile {
  name: string;
  /** Idioma de interfaz elegido en el registro — código de languageOptions (es, en, fr, ja, de). */
  uiLanguage: string;
  interests: string[];
  languages: SelectedLanguage[];
}
