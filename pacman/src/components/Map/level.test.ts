import { test } from "node:test";
import assert from "node:assert/strict";
import { FRUIT_AT, FRUIT_SPAWN, MAZE, MAZE_COLS, NEW_GAME, advance, fruitOut, moveGhost, scatter, step, tick, type Ghost } from "./level.ts";

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

test("tick eats the dot it lands on; the cherry shows at each FRUIT_AT trigger and is taken on contact", () => {
  const dots = (n: number) => new Set(Array.from({ length: n }, (_, i) => `dot${i}`));
  const grab = (g: typeof NEW_GAME) =>
    tick({ ...g, pos: { row: FRUIT_SPAWN.row, col: FRUIT_SPAWN.col - 1 } }, [0, 1]);

  let g = tick({ ...NEW_GAME, pos: { row: 1, col: 1 } }, [0, 1]);
  assert.deepEqual([...g.eaten], ["1,2"]);
  assert.equal(fruitOut(g), false);

  g = grab({ ...g, eaten: dots(FRUIT_AT[0]) });
  assert.deepEqual(g.pos, FRUIT_SPAWN);
  assert.equal(g.fruitTaken, 1);
  assert.equal(fruitOut(g), false, "second cherry waits for the next trigger");

  g = { ...g, eaten: dots(FRUIT_AT[1]) };
  assert.equal(fruitOut(g), true);
  g = grab(g);
  assert.equal(g.fruitTaken, 2);
  assert.equal(fruitOut(g), false, "no third cherry");
});

test("pac-man can't enter the ghost house", () => {
  assert.equal(step(11, 11, 0, 1), null);
});

test("scatter/chase follows the level-1 schedule", () => {
  assert.equal(scatter(0), true);
  assert.equal(scatter(34), true);
  assert.equal(scatter(35), false);
  assert.equal(scatter(135), true);
  assert.equal(scatter(1e6), false, "chase forever at the end");
});

test("ghost picks the closest open tile and never reverses", () => {
  // (1,1): up/left are walls; right (1,2) is closer to (1,5) than down (2,1).
  const g = moveGhost({ pos: { row: 1, col: 1 }, dir: [0, 0], out: true, trail: [] }, { row: 1, col: 5 });
  assert.deepEqual(g.pos, { row: 1, col: 2 });
  // heading right at (1,2) with the target behind: reverse is banned, so keep going right.
  const h = moveGhost(g, { row: 1, col: 0 });
  assert.deepEqual(h.pos, { row: 1, col: 3 });
});

test("a ghost circling a 2x2 block breaks out via its trail", () => {
  // Scatter target top-right from the 2-wide corridor left of the house: pure greedy loops here.
  let g: Ghost = { pos: { row: 11, col: 11 }, dir: [0, -1], out: true, trail: [] };
  const seen = new Set<string>();
  for (let i = 0; i < 12; i++) {
    g = moveGhost(g, { row: 0, col: 26 });
    seen.add(`${g.pos.row},${g.pos.col}`);
  }
  assert.ok(seen.size > 4, `stuck on ${[...seen].join(" ")}`);
});

test("ghosts leave the house in release order and stay off walls", () => {
  let g = NEW_GAME;
  for (let i = 0; i < 20; i++) g = tick(g, [0, 0]);
  assert.deepEqual(g.ghosts.map((x) => x.out), [true, true, false, false], "inky/clyde wait for dots");
  for (const x of g.ghosts) assert.notEqual(MAZE[x.pos.row][x.pos.col], 2);
  g = { ...g, eaten: new Set(Array.from({ length: 60 }, (_, i) => `d${i}`)) };
  for (let i = 0; i < 20; i++) g = tick(g, [0, 0]);
  assert.deepEqual(g.ghosts.map((x) => x.out), [true, true, true, true]);
});
