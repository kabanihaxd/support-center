/** Детерминированный генератор псевдослучайных чисел (mulberry32) — для стабильных демо-данных */
export function createRandom(seed: number) {
  let state = seed >>> 0;
  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min: number, max: number): number => Math.floor(next() * (max - min + 1)) + min,
    pick: <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)],
    chance: (probability: number): boolean => next() < probability,
    /** Выбор по весам: weights[i] соответствует items[i] */
    weighted: <T>(items: readonly T[], weights: readonly number[]): T => {
      const total = weights.reduce((sum, w) => sum + w, 0);
      let roll = next() * total;
      for (let i = 0; i < items.length; i++) {
        roll -= weights[i];
        if (roll <= 0) return items[i];
      }
      return items[items.length - 1];
    },
  };
}

export type Random = ReturnType<typeof createRandom>;
