/**
 * Public entry point for the Map feature — the barrel that re-exports everything
 * the rest of the app is allowed to touch.
 *
 * Why: consumers import from `@/components/Map`, not from deep paths like
 * `@/components/Map/level`. This file is the single seam between the game's
 * internals and its callers, so the folder can be reorganised without a
 * codebase-wide find-and-replace.
 * How: pure re-export. `Map` (the React component, default export of `Map.tsx`)
 * is re-exposed as a named export; the rest is the game model and rules from
 * `level.ts` — grid constants (`MAZE`, `CELL`, `TELEPORTS`…), tuning tables
 * (`POINTS`, `FRIGHT`, `TICK_MS`…), the initial state `NEW_GAME`, the pure
 * step function `tick`, and helper predicates (`isWall`, `cleared`,
 * `released`…). Types are re-exported separately with `export type` so they
 * erase cleanly at build time.
 * What: a side-effect-free module consisting only of `export` statements.
 * Used by: `src/app/page.tsx` (needs `Map`) and `Map.tsx` itself pulls straight
 * from `./level`; tests or future UI would come through here.
 * Design: a hand-written allow-list rather than `export *` so the surface is
 * explicit and reviewable — you can see at a glance exactly what "the Map API"
 * is, and unlisted internals (`towards`, `goHome`, `caught`, the RELEASE
 * tables…) stay private.
 */
export { default as Map } from "./Map";
export {
  CELL,
  MAZE,
  MAZE_COLS,
  MAZE_ROWS,
  NUM_GHOSTS,
  TELEPORTS,
  isWall,
  step,
  advance,
  tick,
  moveGhost,
  scatter,
  tilesOf,
  key,
  cleared,
  fruitOut,
  released,
  DOTS,
  FRUIT_AT,
  FRIGHT,
  FRUIT_SPAWN,
  FRUIT_TICKS,
  POINTS,
  LIVES,
  EXTRA_LIFE_AT,
  GHOST_HOUSE,
  GHOST_SPAWN,
  GHOSTS,
  SPEED,
  TICK_MS,
  NEW_GAME,
  PACMAN_SPAWN,
} from "./level";
export type { CellCode, MovementDelta as Dir, Game, Ghost, Tile } from "./level";
