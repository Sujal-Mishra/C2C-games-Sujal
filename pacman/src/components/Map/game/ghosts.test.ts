import { test } from "node:test";
import assert from "node:assert/strict";
import { moveGhost, type Ghost } from "./ghosts.ts";

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
