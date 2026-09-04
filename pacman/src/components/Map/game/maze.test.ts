import { test } from "node:test";
import assert from "node:assert/strict";
import { CELL, MAZE, MAZE_COLS, MAZE_ROWS, advance, step } from "./maze.ts";
import { FRUIT_SPAWN } from "./pickups.ts";
import { GHOSTS } from "./ghosts.ts";

test("walls block, open tiles pass", () => {
  assert.equal(step(1, 3, -1, 0), null); // into the top border
  assert.deepEqual(step(1, 3, 0, 1), { row: 1, col: 4 });
});

test("stepping onto a teleport mouth emerges at its partner", () => {
  // The side tunnel: (10,1) and (10,23), one on each edge.
  assert.deepEqual(step(10, 2, 0, -1), { row: 10, col: 23 });
  assert.deepEqual(step(10, 22, 0, 1), { row: 10, col: 1 });
  // An interior pair, whose mouths sit well inside the board.
  assert.deepEqual(step(18, 5, 0, 1), { row: 18, col: 18 });
  assert.deepEqual(step(18, 19, 0, -1), { row: 18, col: 6 });
  // A pair that is neither aligned nor facing: (8,4) and (12,20).
  assert.deepEqual(step(9, 4, -1, 0), { row: 12, col: 20 });
  // You land on the partner mouth without being bounced straight back off it.
  assert.equal(MAZE[12][20], CELL.TELEPORT);
});

test("the grid edge is never walkable: every route out is a teleport", () => {
  for (let r = 0; r < MAZE_ROWS; r++)
    for (const c of [0, MAZE_COLS - 1]) assert.equal(step(r, c, 0, c ? 1 : -1), null);
});

test("the off-board filler column is solid", () => {
  assert.equal(MAZE[10][0], CELL.VOID);
  assert.equal(step(10, 1, 0, -1), null); // (10,1) is a teleport mouth, not a way into col 0
});

test("advance turns when it can, else keeps going, else stops", () => {
  const right = [0, 1] as const, up = [-1, 0] as const;
  // (1,3) → up is the border: can't turn, so keep heading right.
  assert.deepEqual(advance({ row: 1, col: 3 }, up, right), { pos: { row: 1, col: 4 }, dir: right });
  // (6,2) → up is open: turn and take it.
  assert.deepEqual(advance({ row: 6, col: 2 }, up, right), { pos: { row: 5, col: 2 }, dir: up });
  // (1,9) → right is a wall and so is up: stay put, still facing right.
  assert.deepEqual(advance({ row: 1, col: 9 }, up, right), { pos: { row: 1, col: 9 }, dir: right });
});

test("advance refuses a mid-corridor reversal, but allows one off a wall", () => {
  const right = [0, 1] as const, left = [0, -1] as const;
  // (1,3) heading right with open track ahead: asking to double back is ignored.
  assert.deepEqual(advance({ row: 1, col: 3 }, left, right), { pos: { row: 1, col: 4 }, dir: right });
  // (1,9) heading right is nose-first into the wall at (1,10): now the turn-around is owed.
  assert.deepEqual(advance({ row: 1, col: 9 }, left, right), { pos: { row: 1, col: 8 }, dir: left });
});

test("pac-man can't enter the ghost house", () => {
  assert.equal(step(8, 9, 0, 1), null);
  assert.equal(step(11, 15, 0, -1), null);
});

test("the hand-placed spawns sit on tiles you can actually stand on", () => {
  // A map edit that walls one of these off would otherwise fail obscurely mid-game.
  assert.equal(MAZE[FRUIT_SPAWN.row][FRUIT_SPAWN.col], CELL.PATH, "cherry needs a dot tile");
  for (const g of GHOSTS) {
    assert.equal(MAZE[g.tile.row][g.tile.col], CELL.GHOST_HOUSE, `${g.name} starts in the house`);
    assert.ok(step(g.door.row, g.door.col, 0, 0, true), `${g.name}'s door is open`);
  }
  // Each start tile needs its own column: waiting ghosts bob half a tile towards the
  // pocket's other row, so two sharing a column would drift into each other on the board.
  const cols = GHOSTS.map((g) => g.tile.col);
  assert.equal(new Set(cols).size, cols.length, `start columns clash: ${cols.join()}`);
});
