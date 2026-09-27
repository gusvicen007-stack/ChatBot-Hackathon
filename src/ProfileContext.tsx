import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Course, StudentProfile } from './types';
import { getLanguage } from './data/languages';
import { buildLearningPath, currentNode } from './data/learningPath';
import { useProgress } from './ProgressContext';
import { getLanguageName, getLocalizedLevels } from './i18n/languageCatalog';
import { isUILang } from './i18n/translations';

const STORAGE_KEY = 'fluenta-profile';

function loadProfile(): StudentProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StudentProfile) : null;
  } catch {
    return null;
  }
}

function coursesFromProfile(
  profile: StudentProfile,
  isCompleted: (topicId: string) => boolean,
): Course[] {
  const uiLang = isUILang(profile.uiLanguage) ? profile.uiLanguage : 'en';

  return profile.languages
    .map(({ languageId, levelCode }) => {
      const language = getLanguage(languageId);
      if (!language) return null;
      const levels = getLocalizedLevels(language, uiLang);
      const sections = buildLearningPath(languageId, levels, levelCode, isCompleted);
      const nodes = sections.flatMap((s) => s.nodes);
      const done = nodes.filter((n) => n.status === 'completed').length;
      const next = currentNode(sections);
      const activeLevel = next?.levelCode ?? sections.at(-1)?.levelCode ?? levelCode;
      const levelInfo = levels.find((l) => l.code === activeLevel);
      const course: Course = {
        id: languageId,
        language: getLanguageName(languageId, uiLang),
        flag: language.flag,
        level: levelInfo?.label ?? activeLevel,
        levelCode: activeLevel,
        progress: nodes.length ? Math.round((done / nodes.length) * 100) : 0,
        lessonsDone: done,
        lessonsTotal: nodes.length || 1,
        color: language.color,
        nextTopic: next?.topic.title ?? '—',
        nextTopicId: next?.topic.id ?? null,
      };
      return course;
    })
    .filter((c): c is Course => c !== null);
}

interface ProfileContextValue {
  profile: StudentProfile | null;
  courses: Course[];
  hasProfile: boolean;
  saveProfile: (profile: StudentProfile) => void;
  clearProfile: () => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { isCompleted, resetProgress } = useProgress();
  const [profile, setProfile] = useState<StudentProfile | null>(() => loadProfile());

  // Guardar un perfil = registrar un usuario nuevo, así que racha, XP,
  // minutos y lecciones empiezan de cero.
  const saveProfile = (next: StudentProfile) => {
    resetProgress();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setProfile(next);
  };

  const clearProfile = () => {
    localStorage.removeItem(STORAGE_KEY);
    setProfile(null);
  };

  const courses = profile ? coursesFromProfile(profile, isCompleted) : [];

  return (
    <ProfileContext.Provider value={{ profile, courses, hasProfile: !!profile, saveProfile, clearProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
