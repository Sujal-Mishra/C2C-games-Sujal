import { describe, expect, test } from "vitest";
import type { GameState, QuarterTurn } from "./types";
import {
  clampSpawnX,
  dropPiece,
  getEndlessCameraTargetY,
  hasPieceMissed,
  lockPiece,
  loseLife,
  pickShape,
  restartGame,
  rotateQuarterTurn,
  updateSettlement
} from "./rules";

const initial: GameState = {
  phase: "aiming",
  score: 0,
  rotation: 0,
  settleStartedAt: null
};

describe("aiming rules", () => {
  test("rotation wraps after four quarter turns", () => {
    let turn: QuarterTurn = 0;
    for (let index = 0; index < 4; index += 1) turn = rotateQuarterTurn(turn);
    expect(turn).toBe(0);
  });

  test("spawn position stays inside the playable range", () => {
    expect(clampSpawnX(-20, 80, 720)).toBe(80);
    expect(clampSpawnX(400, 80, 720)).toBe(400);
    expect(clampSpawnX(900, 80, 720)).toBe(720);
  });

  test("only an aiming piece can be dropped", () => {
    expect(dropPiece(initial).phase).toBe("falling");
    expect(dropPiece({ ...initial, phase: "falling" }).phase).toBe("falling");
  });
});

describe("settling rules", () => {
  test("contact starts settling and renewed motion resets it", () => {
    const settling = updateSettlement({ ...initial, phase: "falling" }, true, 0.1, 0.01, 100);
    expect(settling).toMatchObject({ phase: "settling", settleStartedAt: 100 });

    const moving = updateSettlement(settling, true, 0.5, 0.01, 500);
    expect(moving).toMatchObject({ phase: "falling", settleStartedAt: null });
  });

  test("one second of low motion makes a piece ready to lock", () => {
    const settling = updateSettlement({ ...initial, phase: "falling" }, true, 0.1, 0.01, 100);
    expect(updateSettlement(settling, true, 0.1, 0.01, 1099).phase).toBe("settling");
    expect(updateSettlement(settling, true, 0.1, 0.01, 1100).phase).toBe("locked");
  });

  test("locking awards exactly 100 points only once", () => {
    const ready = { ...initial, phase: "locked" as const, settleStartedAt: 100 };
    expect(lockPiece(ready).score).toBe(100);
    expect(lockPiece(lockPiece(ready)).score).toBe(100);
  });
});

describe("run lifecycle", () => {
  test("a run has three lives and cannot drop below zero", () => {
    expect(loseLife(3)).toBe(2);
    expect(loseLife(2)).toBe(1);
    expect(loseLife(1)).toBe(0);
    expect(loseLife(0)).toBe(0);
  });

  test("the endless camera follows the stack once it reaches mid-screen", () => {
    expect(getEndlessCameraTargetY(0, 400, 650)).toBe(0);
    expect(getEndlessCameraTargetY(0, 300, 650)).toBe(-25);
    expect(getEndlessCameraTargetY(-25, 250, 650)).toBe(-75);
  });

  test("only an active piece below the failure boundary counts as a miss", () => {
    expect(hasPieceMissed(721, 720)).toBe(true);
    expect(hasPieceMissed(719, 720)).toBe(false);
  });

  test("restart clears phase, score, rotation, and settlement", () => {
    expect(restartGame()).toEqual(initial);
  });

  test("random selection maps boundary values to supported assets", () => {
    expect([pickShape(0), pickShape(0.49), pickShape(0.5), pickShape(0.99)]).toEqual([
      "logo",
      "logo",
      "petal",
      "petal"
    ]);
  });
});
