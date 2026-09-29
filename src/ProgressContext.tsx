import { createContext, useContext, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'fluenta-progress';

/** XP que da una lección nueva del mapa y una repetición de una ya completada. */
export const LESSON_XP = 20;
export const REVIEW_XP = 5;

export interface UserProgress {
  xp: number;
  streakDays: number;
  /** Último día con una clase terminada (YYYY-MM-DD, hora local). */
  lastActiveDate: string | null;
  /** Lunes de la semana a la que corresponden `weekMinutes`. */
  weekStart: string;
  /** Minutos practicados de lunes a domingo. */
  weekMinutes: number[];
  weeklyGoalMinutes: number;
  /** Ids de los temas terminados (los ids ya incluyen idioma y nivel: 'en-a1-3'). */
  completedTopics: string[];
}

function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function mondayOf(date: Date): string {
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return dayKey(monday);
}

function yesterdayKey(date: Date): string {
  const y = new Date(date);
  y.setDate(date.getDate() - 1);
  return dayKey(y);
}

function freshProgress(): UserProgress {
  return {
    xp: 0,
    streakDays: 0,
    lastActiveDate: null,
    weekStart: mondayOf(new Date()),
    weekMinutes: [0, 0, 0, 0, 0, 0, 0],
    weeklyGoalMinutes: 150,
    completedTopics: [],
  };
}

/**
 * Ajusta lo que depende del calendario: si pasó más de un día sin clase la racha
 * vuelve a 0, y si empezó otra semana los minutos semanales se reinician.
 */
function normalize(progress: UserProgress, today = new Date()): UserProgress {
  const next = { ...progress };
  const key = dayKey(today);
  if (next.lastActiveDate !== key && next.lastActiveDate !== yesterdayKey(today)) {
    next.streakDays = 0;
  }
  const monday = mondayOf(today);
  if (next.weekStart !== monday) {
    next.weekStart = monday;
    next.weekMinutes = [0, 0, 0, 0, 0, 0, 0];
  }
  return next;
}

function loadProgress(): UserProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return normalize(raw ? { ...freshProgress(), ...(JSON.parse(raw) as UserProgress) } : freshProgress());
  } catch {
    return freshProgress();
  }
}

function persist(progress: UserProgress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Sin almacenamiento (modo privado): el progreso vive solo en memoria.
  }
}

export interface LessonResult {
  topicId: string;
  minutes: number;
}

export interface PracticeResult {
  minutes: number;
  xp: number;
}

interface ProgressContextValue {
  progress: UserProgress;
  isCompleted: (topicId: string) => boolean;
  /** Registra una clase terminada y devuelve el XP ganado. */
  completeLesson: (result: LessonResult) => number;
  /** Registra práctica libre (simulaciones): XP, racha y minutos, sin marcar temas del mapa. */
  completePractice: (result: PracticeResult) => number;
  /** Deja todo en cero — se usa al registrar un usuario nuevo. */
  resetProgress: () => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<UserProgress>(() => loadProgress());

  const update = (next: UserProgress) => {
    persist(next);
    setProgress(next);
  };

  const isCompleted = (topicId: string) => progress.completedTopics.includes(topicId);

  /** Suma XP, minutos del día y actualiza la racha (común a lecciones y simulaciones). */
  const record = (current: UserProgress, gained: number, minutes: number, today: Date): UserProgress => {
    const todayKey = dayKey(today);
    let streakDays = current.streakDays;
    if (current.lastActiveDate !== todayKey) {
      streakDays = current.lastActiveDate === yesterdayKey(today) ? streakDays + 1 : 1;
    }
    const weekMinutes = [...current.weekMinutes];
    weekMinutes[(today.getDay() + 6) % 7] += Math.max(1, Math.round(minutes));
    return { ...current, xp: current.xp + gained, streakDays, lastActiveDate: todayKey, weekMinutes };
  };

  const completeLesson = ({ topicId, minutes }: LessonResult) => {
    const today = new Date();
    const current = normalize(progress, today);
    const isReview = current.completedTopics.includes(topicId);
    const gained = isReview ? REVIEW_XP : LESSON_XP;
    const next = record(current, gained, minutes, today);
    update({
      ...next,
      completedTopics: isReview ? current.completedTopics : [...current.completedTopics, topicId],
    });
    return gained;
  };

  const completePractice = ({ minutes, xp }: PracticeResult) => {
    const today = new Date();
    update(record(normalize(progress, today), xp, minutes, today));
    return xp;
  };

  const resetProgress = () => update(freshProgress());

  return (
    <ProgressContext.Provider value={{ progress, isCompleted, completeLesson, completePractice, resetProgress }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
}
