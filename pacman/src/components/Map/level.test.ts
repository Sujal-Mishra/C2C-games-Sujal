import { test } from "node:test";
import assert from "node:assert/strict";
import { DOTS, EXTRA_LIFE_AT, FRIGHT, FRUIT_AT, FRUIT_SPAWN, FRUIT_TICKS, LIVES, MAZE, MAZE_COLS, NEW_GAME, POINTS, advance, cleared, fruitOut, key, moveGhost, released, scatter, step, tick, type Dir, type Ghost } from "./level.ts";

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

test("tick eats the dot it lands on; the grape shows at each FRUIT_AT trigger, is taken on contact or leaves after 9s", () => {
  const dots = (n: number) => new Set(Array.from({ length: n }, (_, i) => `dot${i}`));
  // Eat (1,2) from (1,1) with `n` fake dots already gone, so the dot count lands exactly on n + 1.
  const eat = (g: typeof NEW_GAME, n: number) => tick({ ...g, pos: { row: 1, col: 1 }, eaten: dots(n) }, [0, 1]);
  const grab = (g: typeof NEW_GAME) =>
    tick({ ...g, pos: { row: FRUIT_SPAWN.row, col: FRUIT_SPAWN.col - 1 } }, [0, 1]);

  let g = tick({ ...NEW_GAME, pos: { row: 1, col: 1 } }, [0, 1]);
  assert.deepEqual([...g.eaten], ["1,2"]);
  assert.equal(g.score, POINTS.pellet);
  assert.equal(fruitOut(g), false);
  g = tick(g, [0, -1]); // back onto the power pellet at (1,1)
  assert.equal(g.score, POINTS.pellet + POINTS.power);
  assert.equal(tick(g, [0, 1]).score, g.score, "an eaten dot scores nothing");

  g = eat({ ...g, score: 0 }, FRUIT_AT[0] - 1);
  assert.equal(fruitOut(g), true, "70th dot brings the grape out");
  assert.equal(g.fruit, FRUIT_TICKS);
  g = grab(g);
  assert.deepEqual(g.pos, FRUIT_SPAWN);
  assert.equal(g.fruits, 1);
  assert.equal(g.score, POINTS.pellet + POINTS.grape + POINTS.pellet, "grape plus the dot under it");
  assert.equal(fruitOut(g), false, "second grape waits for the next trigger");

  g = eat(g, FRUIT_AT[1] - 1);
  assert.equal(fruitOut(g), true);
  for (let i = 1; i < FRUIT_TICKS; i++) g = { ...tick(g, [0, 0]), ghosts: NEW_GAME.ghosts }; // nobody home to bite
  assert.equal(fruitOut(g), true, "still out on the last tick");
  g = tick(g, [0, 0]);
  assert.equal(fruitOut(g), false, "gone after 9s");
  assert.equal(g.fruits, 2);
  assert.equal(grab(g).score, g.score + POINTS.pellet, "nothing to grab; no third grape");
});

test("4s without a dot lets the next ghost out of the house", () => {
  let g = NEW_GAME; // standing still at spawn: no dots eaten
  const idle = (n: number) => { for (let i = 0; i < n; i++) g = { ...tick(g, [0, 0]), ghosts: NEW_GAME.ghosts }; };
  idle(19);
  assert.deepEqual([2, 3].map((i) => released(g, i)), [false, false]);
  idle(1);
  assert.deepEqual([2, 3].map((i) => released(g, i)), [true, false], "inky freed at 4s");
  idle(20);
  assert.equal(released(g, 3), true, "clyde 4s later");
  assert.equal(tick({ ...g, pos: { row: 1, col: 1 } }, [0, 1]).idle, 0, "a dot restarts the clock");
});

test("eating the last dot completes the game and freezes it", () => {
  const all = new Set([...DOTS.pellets, ...DOTS.power].map(key));
  all.delete("1,2");
  const g = tick({ ...NEW_GAME, pos: { row: 1, col: 1 }, eaten: all }, [0, 1]);
  assert.equal(cleared(g), true);
  assert.equal(g.lives, LIVES);
  assert.equal(tick(g, [0, 1]), g);
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
  const g = moveGhost({ pos: { row: 1, col: 1 }, dir: [0, 0], out: true, trail: [], mode: "normal" }, { row: 1, col: 5 });
  assert.deepEqual(g.pos, { row: 1, col: 2 });
  // heading right at (1,2) with the target behind: reverse is banned, so keep going right.
  const h = moveGhost(g, { row: 1, col: 0 });
  assert.deepEqual(h.pos, { row: 1, col: 3 });
});

test("a ghost circling a 2x2 block breaks out via its trail", () => {
  // Scatter target top-right from the 2-wide corridor left of the house: pure greedy loops here.
  let g: Ghost = { pos: { row: 11, col: 11 }, dir: [0, -1], out: true, trail: [], mode: "normal" };
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

test("a power pellet frightens the ghosts: reverse, wander at half speed, time out", () => {
  // Ghost heading up at (4,1); Pac-Man steps left from (1,2) onto the power pellet at (1,1).
  const blinky: Ghost = { pos: { row: 4, col: 1 }, dir: [-1, 0], out: true, trail: [], mode: "normal" };
  let g = tick({ ...NEW_GAME, pos: { row: 1, col: 2 }, ghosts: [blinky, ...NEW_GAME.ghosts.slice(1)] }, [0, -1]);
  assert.equal(g.fright, FRIGHT.ticks);
  assert.notDeepEqual(g.ghosts[0].pos, { row: 3, col: 1 }, "reversed, so not carrying on up");
  g = { ...g, pos: { row: 25, col: 13 } }; // out of the wanderer's reach, so it can't get eaten

  for (let i = 1; i < FRIGHT.ticks; i++) {
    const before = g.ghosts[0].pos;
    g = tick(g, [0, 0]);
    if (g.t % 2) assert.deepEqual(g.ghosts[0].pos, before, "half speed: rests on odd ticks");
    assert.notEqual(MAZE[g.ghosts[0].pos.row][g.ghosts[0].pos.col], 2);
  }
  assert.equal(g.fright, 1);
  assert.equal(tick(g, [0, 0]).fright, 0);
});

test("an unfrightened ghost on Pac-Man's tile costs a life and resets the board, not the dots", () => {
  // Blinky heads left from (1,3), Pac-Man right from (1,1): both land on (1,2).
  const blinky: Ghost = { pos: { row: 1, col: 3 }, dir: [0, -1], out: true, trail: [], mode: "normal" };
  const start = { ...NEW_GAME, pos: { row: 1, col: 1 }, eaten: new Set(["9,9"]), ghosts: [blinky, ...NEW_GAME.ghosts.slice(1)], t: 50 };
  let g = tick(start, [0, 1]);
  assert.equal(g.lives, LIVES - 1);
  assert.deepEqual(g.pos, NEW_GAME.pos);
  assert.deepEqual(g.ghosts, NEW_GAME.ghosts);
  assert.equal(g.t, 0);
  assert.equal(g.since, 2, "dots eaten so far, for the after-death release table");
  assert.ok(g.eaten.has("9,9") && g.eaten.has("1,2"), "dots stay eaten");

  const eyes = { ...start, ghosts: [{ ...blinky, mode: "eyes" as const }, ...start.ghosts.slice(1)] };
  assert.equal(tick(eyes, [0, 1]).lives, LIVES, "eyes don't kill");

  g = tick({ ...start, lives: 1 }, [0, 1]);
  assert.equal(g.lives, 0);
  assert.equal(tick(g, [0, 1]), g, "game over: frozen");
});

test("one extra life at 10,000 points", () => {
  let g = tick({ ...NEW_GAME, pos: { row: 1, col: 1 }, score: EXTRA_LIFE_AT - POINTS.pellet }, [0, 1]);
  assert.equal(g.lives, LIVES + 1);
  g = tick(g, [0, 1]);
  assert.equal(g.lives, LIVES + 1, "only once");
});

test("eating a scared ghost: 200/400 combo, one-second freeze, eyes run home and regenerate", () => {
  // Same head-on meeting as the death test, but Blinky is scared.
  const blinky: Ghost = { pos: { row: 1, col: 3 }, dir: [0, -1], out: true, trail: [], mode: "scared" };
  const pinky: Ghost = { ...blinky, pos: { row: 2, col: 3 }, dir: [-1, 0] };
  const start = { ...NEW_GAME, pos: { row: 1, col: 1 }, ghosts: [blinky, pinky, ...NEW_GAME.ghosts.slice(2)], fright: 20, t: 1 };
  let g = tick(start, [0, 1]);
  assert.equal(g.lives, LIVES);
  assert.equal(g.score, NEW_GAME.score + POINTS.pellet + POINTS.ghost);
  assert.equal(g.ghosts[0].mode, "eyes");
  assert.deepEqual(g.bite, { pos: { row: 1, col: 2 }, points: POINTS.ghost, left: 5 });

  const frozen = g;
  for (let i = 0; i < 5; i++) g = tick(g, [0, 1]);
  assert.equal(g.bite, null);
  assert.deepEqual([g.pos, g.ghosts, g.fright, g.t], [frozen.pos, frozen.ghosts, frozen.fright, frozen.t], "nothing moves while frozen");

  // Keep the others in the house meanwhile so a wandering scared ghost can't bump into Pac-Man.
  for (let i = 0; i < 40 && g.ghosts[0].mode === "eyes"; i++) {
    g = tick(g, [0, 0]);
    g = { ...g, ghosts: [g.ghosts[0], ...NEW_GAME.ghosts.slice(1)] };
  }
  assert.equal(g.ghosts[0].mode, "normal", "eyes are home and regenerated");
  assert.equal(g.ghosts[0].out, false);

  // Pinky, still scared, is the second ghost of this pellet: 400.
  const again = { ...g, pos: { row: 1, col: 1 }, ghosts: [g.ghosts[0], { ...pinky, pos: { row: 1, col: 3 }, dir: [0, -1] as Dir }, ...g.ghosts.slice(2)], fright: 20 };
  assert.equal(tick(again, [0, 1]).score - again.score, 2 * POINTS.ghost);
  // A new power pellet restarts the combo.
  assert.equal(tick({ ...again, pos: { row: 1, col: 2 }, ghosts: [g.ghosts[0], { ...pinky, pos: { row: 1, col: 0 }, dir: [0, 1] as Dir }, ...g.ghosts.slice(2)] }, [0, -1]).combo, 0);
});
