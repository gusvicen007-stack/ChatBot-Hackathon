import type { VoiceTranscript } from './useVoiceAgent';

/** Lo que devuelve POST /api/report. Ver server/api.mjs. */
export interface LessonReport {
  summary: string;
  strengths: string[];
  /** Cada 'said' es una cita real del alumno: el servidor descarta las inventadas. */
  corrections: { said: string; better: string; why: string }[];
  new_vocabulary: { term: string; meaning: string }[];
  level_estimate: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  next_step: string;
  meta: { model?: string; request_id?: string; corrections_discarded: number };
}

export interface ReportInput {
  transcript: VoiceTranscript[];
  targetLang: string;
  nativeLang: string;
  level: string;
  topic?: string;
}

export async function requestReport(input: ReportInput): Promise<LessonReport> {
  const res = await fetch('/api/report', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `No se pudo generar el reporte (${res.status})`);
  return data as LessonReport;
}
