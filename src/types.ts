export interface Course {
  id: string;
  language: string;
  flag: string;
  level: string;
  progress: number;
  lessonsDone: number;
  lessonsTotal: number;
  color: string;
  nextTopic: string;
}

export interface Student {
  name: string;
  email: string;
  streakDays: number;
  xp: number;
  weeklyGoalMinutes: number;
  weeklyMinutesDone: number;
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
