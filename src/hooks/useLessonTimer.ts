import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Temporizador de la lección. Con `limitMinutes` (> 0) cuenta hacia atrás;
 * con 0 o null es libre y solo mide el tiempo practicado. No corre hasta que
 * se llama a `start()` (cuando el alumno empieza a practicar). Se puede pausar
 * y sumar minutos cuando se acaba el tiempo.
 */
export function useLessonTimer(limitMinutes: number | null) {
  const [limitMs, setLimitMs] = useState(limitMinutes ? limitMinutes * 60_000 : null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [paused, setPaused] = useState(false);
  const [started, setStarted] = useState(false);
  const lastTick = useRef(0); // se fija al arrancar cada tramo (efecto de abajo)

  const timeUp = limitMs !== null && elapsedMs >= limitMs;
  const running = started && !paused && !timeUp;

  useEffect(() => {
    if (!running) return;
    lastTick.current = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTick.current;
      lastTick.current = now;
      setElapsedMs((e) => (limitMs !== null ? Math.min(limitMs, e + delta) : e + delta));
    }, 250);
    return () => clearInterval(id);
  }, [running, limitMs]);

  const start = useCallback(() => setStarted(true), []);
  const pause = useCallback(() => setPaused(true), []);
  const resume = useCallback(() => setPaused(false), []);
  /** Suma minutos al límite (y reanuda si se había acabado). */
  const addMinutes = useCallback((minutes: number) => {
    setLimitMs((l) => (l === null ? l : l + minutes * 60_000));
    setPaused(false);
  }, []);

  return {
    elapsedMs,
    limitMs,
    remainingMs: limitMs === null ? null : Math.max(0, limitMs - elapsedMs),
    paused,
    started,
    running,
    timeUp,
    start,
    pause,
    resume,
    addMinutes,
  };
}

/** 125000 → "2:05" */
export function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
