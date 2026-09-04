const SCORE_KEY = "logo-stack-best";

export interface ScoreStore {
  readBest(): number;
  writeBest(score: number): void;
}

export function createLocalScoreStore(storage?: Storage): ScoreStore {
  const target = storage ?? (typeof window !== "undefined" ? window.localStorage : undefined);
  return {
    readBest() {
      try {
        const value = Number(target?.getItem(SCORE_KEY));
        return Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
      } catch {
        return 0;
      }
    },
    writeBest(score) {
      try {
        target?.setItem(SCORE_KEY, String(Math.max(0, Math.floor(score))));
      } catch {
        // Storage can be unavailable in privacy modes; gameplay continues.
      }
    }
  };
}

export function updateBestScore(current: number, best: number, store: ScoreStore): number {
  if (current <= best) return best;
  store.writeBest(current);
  return current;
}
