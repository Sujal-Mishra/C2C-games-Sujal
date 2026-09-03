import { test } from "node:test";
import assert from "node:assert/strict";
import { MAZE, MAZE_COLS, advance, step } from "./maze.ts";

test("walls block, open tiles pass", () => {
  assert.equal(step(1, 1, -1, 0), null); // into the top border
  assert.deepEqual(step(1, 1, 0, 1), { row: 1, col: 2 });
});

test("tunnel wraps instead of leaving the grid", () => {
  assert.deepEqual(step(13, 0, 0, -1), { row: 13, col: MAZE_COLS - 1 });
  assert.deepEqual(step(13, MAZE_COLS - 1, 0, 1), { row: 13, col: 0 });
});

test("the only ways off the grid are the tunnel mouths", () => {
  for (let r = 0; r < MAZE.length; r++)
    for (const c of [0, MAZE_COLS - 1])
      if (step(r, c, 0, c ? 1 : -1)) assert.equal(r, 13);
});

test("advance turns when it can, else keeps going, else stops", () => {
  const right = [0, 1] as const, up = [-1, 0] as const;
  // (1,1) → up is the border: can't turn, so keep heading right.
  assert.deepEqual(advance({ row: 1, col: 1 }, up, right), { pos: { row: 1, col: 2 }, dir: right });
  // (4,1) → up is open: turn and take it.
  assert.deepEqual(advance({ row: 4, col: 1 }, up, right), { pos: { row: 3, col: 1 }, dir: up });
  // (1,12) → right is a wall and so is up: stay put, still facing right.
  assert.deepEqual(advance({ row: 1, col: 12 }, up, right), { pos: { row: 1, col: 12 }, dir: right });
});

test("pac-man can't enter the ghost house", () => {
  assert.equal(step(11, 11, 0, 1), null);
});
