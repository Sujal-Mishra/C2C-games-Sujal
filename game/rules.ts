import type { GameState, QuarterTurn, ShapeType } from "./types";

export const SETTLE_MS = 1000;
export const LINEAR_SPEED_LIMIT = 0.18;
export const ANGULAR_SPEED_LIMIT = 0.02;
export const POINTS_PER_PIECE = 100;

export const INITIAL_GAME_STATE: GameState = {
  phase: "aiming",
  score: 0,
  rotation: 0,
  settleStartedAt: null
};

export function rotateQuarterTurn(turn: QuarterTurn): QuarterTurn {
  return ((turn + 1) % 4) as QuarterTurn;
}

export function clampSpawnX(x: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, x));
}

export function dropPiece(state: GameState): GameState {
  if (state.phase !== "aiming") return state;
  return { ...state, phase: "falling", settleStartedAt: null };
}

export function updateSettlement(
  state: GameState,
  touching: boolean,
  linearSpeed: number,
  angularSpeed: number,
  now: number
): GameState {
  if (state.phase === "gameOver" || state.phase === "aiming" || state.phase === "locked") {
    return state;
  }

  const stable =
    touching &&
    linearSpeed <= LINEAR_SPEED_LIMIT &&
    Math.abs(angularSpeed) <= ANGULAR_SPEED_LIMIT;

  if (!stable) return { ...state, phase: "falling", settleStartedAt: null };

  const startedAt = state.settleStartedAt ?? now;
  if (now - startedAt >= SETTLE_MS) {
    return { ...state, phase: "locked", settleStartedAt: startedAt };
  }

  return { ...state, phase: "settling", settleStartedAt: startedAt };
}

export function lockPiece(state: GameState): GameState {
  if (state.phase !== "locked" || state.settleStartedAt === null) return state;
  return { ...state, score: state.score + POINTS_PER_PIECE, settleStartedAt: null };
}

export function detectFailure(
  state: GameState,
  bodyCentersY: readonly number[],
  failureBoundary: number
): GameState {
  if (!bodyCentersY.some((y) => y > failureBoundary)) return state;
  return { ...state, phase: "gameOver", settleStartedAt: null };
}

export function restartGame(): GameState {
  return { ...INITIAL_GAME_STATE };
}

export function pickShape(random: number = Math.random()): ShapeType {
  const normalized = Math.min(0.999999, Math.max(0, random));
  return normalized < 0.5 ? "logo" : "blossom";
}
