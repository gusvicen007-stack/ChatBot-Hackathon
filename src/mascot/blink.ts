import { createRng } from './math';

/** Duración de un parpadeo, en segundos — igual a `BLINK_DUR` en bloub: medido
 * como el mínimo que se lee como parpadeo sin sentirse como un tic. */
const BLINK_DUR = 0.18;

const RNG = createRng(0x5eed);

/** Calendario de parpadeos pre-calculado: determinista y sin estado, cubre
 * una hora de sesión. Intervalos irregulares (1.9–4.6 s) con un doble
 * parpadeo ocasional, como en bloub — nunca un metrónomo. */
const SCHEDULE: number[] = (() => {
  const out: number[] = [];
  let t = 1.2;
  while (t < 3600) {
    out.push(t);
    t += 1.9 + RNG() * 2.7;
    if (RNG() < 0.18) {
      out.push(t);
      t += 0.24;
    }
  }
  return out;
})();

/**
 * 1 = ojo abierto, 0 = cerrado. El cierre es más rápido que la apertura
 * (45 % / 55 % del tiempo del parpadeo), la misma asimetría que bloub mide
 * del video de referencia — un parpadeo simétrico se lee como animatrónico.
 */
export function blinkLid(t: number): number {
  for (const start of SCHEDULE) {
    if (t < start) break;
    const k = (t - start) / BLINK_DUR;
    if (k >= 0 && k <= 1) {
      return k < 0.45 ? 1 - k / 0.45 : (k - 0.45) / 0.55;
    }
  }
  return 1;
}
