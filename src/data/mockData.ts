import type { Student } from '../types';

export const student: Student = {
  name: 'Gustavo',
  email: 'gusvicen007@gmail.com',
  streakDays: 12,
  xp: 3420,
  weeklyGoalMinutes: 150,
  weeklyMinutesDone: 95,
};

/** Minutos practicados de lunes a domingo — las etiquetas del día se traducen aparte. */
export const weekActivityMinutes: number[] = [20, 15, 0, 30, 10, 20, 0];
