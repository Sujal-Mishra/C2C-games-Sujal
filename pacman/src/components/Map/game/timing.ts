export const TICK_MS = 200; // ms per tile: bigger = slower
export const SEC = 1000 / TICK_MS;

/** Level-1 mode phases in ticks, scatter first, alternating; chase forever after the last. */
const PHASES = [7, 20, 7, 20, 5, 20, 5].map((s) => s * SEC);

/** Frightened lasts 6s at level 1, flashing white for the last 2s. */
export const FRIGHT = { ticks: 6 * SEC, flash: 2 * SEC };

/** True while the scatter/chase clock (in ticks) sits in a scatter phase. */
export function scatter(t: number): boolean {
  for (let i = 0; i < PHASES.length; i++) {
    if (t < PHASES[i]) return i % 2 === 0;
    t -= PHASES[i];
  }
  return false;
}
