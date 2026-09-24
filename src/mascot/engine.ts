import { blinkLid } from './blink';
import { loopNoise, TAU } from './math';

export type MascotState = 'idle' | 'thinking' | 'celebrate';

export interface MascotFrame {
  /** 1 = ojos abiertos, 0 = cerrados. */
  lid: number;
  /** Desplazamiento de la mirada (pupilas + brillo), en px del viewBox. */
  gazeX: number;
  gazeY: number;
  /** Inclinación sutil del cuerpo, en grados — solo se usa en "thinking". */
  lean: number;
  /** Escala de "respiración" del cuerpo — casi imperceptible, nunca un flote. */
  breathe: number;
  /** Brillo de la punta de la varita, 0–1. */
  wandGlow: number;
}

/**
 * `sample(t, state)` es una función pura del tiempo — sin reloj interno, sin
 * `Date.now()` — el mismo principio que `engine.sample(t)` en bloub
 * (github.com/jeremy-prt/bloub): pausar, retomar o pedir cualquier instante
 * da siempre la misma imagen. La vida del personaje vive en los ojos
 * (parpadeo + deriva de la mirada), no en el cuerpo — ahí bloub mide que su
 * bot casi no se mueve en reposo, y aquí pasa lo mismo.
 */
export function sample(t: number, state: MascotState): MascotFrame {
  const thinking = state === 'thinking';

  // Mientras "piensa" los ojos se quedan fijos y abiertos — no parpadea a
  // mitad de una respuesta, para leerse como atención, no como tic.
  const lid = thinking ? 1 : blinkLid(t);

  const gazeX = loopNoise(t, 7.9, 1.9) * 1.6 + loopNoise(t, 3.1, 0.4) * 0.7;
  const gazeY = loopNoise(t, 5.3, 0.3) * 1.3 + loopNoise(t, 9.1, 1.3) * 0.5;

  const lean = thinking ? Math.sin((t / 1.6) * TAU) * 3 : 0;

  const breathe = state === 'celebrate' ? 1 : 1 + 0.006 * Math.sin((t / 4) * TAU);

  const wandGlow = thinking
    ? 0.55 + 0.45 * Math.sin(t * 9)
    : 0.65 + 0.35 * Math.sin(t * 2.1);

  return { lid, gazeX, gazeY, lean, breathe, wandGlow };
}
