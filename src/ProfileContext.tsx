import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Course, StudentProfile } from './types';
import { getLanguage } from './data/languages';
import { getTopics } from './data/syllabus';
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

function coursesFromProfile(profile: StudentProfile): Course[] {
  const uiLang = isUILang(profile.uiLanguage) ? profile.uiLanguage : 'es';

  return profile.languages
    .map(({ languageId, levelCode }) => {
      const language = getLanguage(languageId);
      if (!language) return null;
      const levelInfo = getLocalizedLevels(language, uiLang).find((l) => l.code === levelCode);
      const topics = getTopics(languageId, levelCode);
      const course: Course = {
        id: languageId,
        language: getLanguageName(languageId, uiLang),
        flag: language.flag,
        level: levelInfo?.label ?? levelCode,
        progress: 0,
        lessonsDone: 0,
        lessonsTotal: topics.length || 1,
        color: language.color,
        nextTopic: topics[0]?.title ?? '—',
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
  const [profile, setProfile] = useState<StudentProfile | null>(() => loadProfile());

  const saveProfile = (next: StudentProfile) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setProfile(next);
  };

  const clearProfile = () => {
    localStorage.removeItem(STORAGE_KEY);
    setProfile(null);
  };

  const courses = profile ? coursesFromProfile(profile) : [];

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
