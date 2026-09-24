export const TAU = Math.PI * 2;

/** Ease-out exponencial — el mismo tipo de curva que bloub mide en su bot: la
 * llegada nunca rebota, solo desacelera. */
export function easeOutExpo(k: number): number {
  return k >= 1 ? 1 : 1 - Math.pow(2, -10 * k);
}

/**
 * Ruido 1D periódico, sin costuras: tres senos primos entre sí en frecuencia
 * para que la deriva nunca se sienta como un vaivén mecánico. Mismo principio
 * que `loopNoise` en bloub (github.com/jeremy-prt/bloub), reescrito para esta
 * app en vez de copiado.
 */
export function loopNoise(t: number, period: number, seed = 0): number {
  const p = (t / period) * TAU;
  return (
    0.55 * Math.sin(p + seed) +
    0.3 * Math.sin(2 * p + seed * 1.7 + 1.1) +
    0.15 * Math.sin(3 * p + seed * 2.3 + 2.4)
  );
}

/** PRNG determinista (mulberry32): misma secuencia siempre, para un calendario
 * de parpadeos que no cambia entre renders. */
export function createRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
