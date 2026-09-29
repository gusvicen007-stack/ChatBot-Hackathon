/** Minutos de práctica que se pueden elegir por lección. 0 = libre (sin límite). */
export const DURATION_OPTIONS = [5, 10, 15, 20, 0] as const;

const KEY = 'fluenta-lesson-minutes';
const DEFAULT_MINUTES = 10;

/** La última duración elegida, para proponerla en la siguiente lección. */
export function loadPreferredMinutes(): number {
  try {
    const raw = localStorage.getItem(KEY);
    const saved = Number(raw);
    return raw !== null && (DURATION_OPTIONS as readonly number[]).includes(saved) ? saved : DEFAULT_MINUTES;
  } catch {
    return DEFAULT_MINUTES;
  }
}

export function savePreferredMinutes(minutes: number) {
  try {
    localStorage.setItem(KEY, String(minutes));
  } catch {
    // Sin almacenamiento: solo no se recuerda para la próxima.
  }
}
