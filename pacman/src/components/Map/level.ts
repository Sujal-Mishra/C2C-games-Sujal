import level from "./level.json" with { type: "json" };

/** Cell codes used by the level editor export in `level.json`. */
export const CELL = {
  PATH: 1,
  WALL: 2,
  GHOST_HOUSE: 3,
  TELEPORT: 4,
  POWER_PELLET: 5,
  PACMAN_SPAWN: 6,
  GHOST_SPAWN: 7,
} as const;

export type CellCode = (typeof CELL)[keyof typeof CELL];

export const MAZE: readonly (readonly CellCode[])[] = level.map as CellCode[][];

export const MAZE_ROWS = MAZE.length;
export const MAZE_COLS = MAZE[0].length;

/** Paired tunnel openings, as {x: col, y: row} endpoints. */
export const TELEPORTS = level.teleports;

export const NUM_GHOSTS = level.numGhosts;

/** Cells outside the grid count as open so the outer border draws an outline. */
export function isWall(row: number, col: number): boolean {
  if (row < 0 || row >= MAZE_ROWS || col < 0 || col >= MAZE_COLS) return false;
  return MAZE[row][col] === CELL.WALL;
}

const TELEPORT_PARTNER = new Map(
  TELEPORTS.flatMap(({ endpoints: [a, b] }) => [
    [`${a.y},${a.x}`, b],
    [`${b.y},${b.x}`, a],
  ] as const),
);

export type Tile = { row: number; col: number };
/** Unit step as [dRow, dCol]; [0, 0] is standing still. */
export type Dir = readonly [number, number];

/** Every tile carrying `code`, in row-major order. */
export function tilesOf(code: CellCode): Tile[] {
  return MAZE.flatMap((line, row) =>
    line.flatMap((cell, col) => (cell === code ? [{ row, col }] : [])),
  );
}

export const key = (t: Tile) => `${t.row},${t.col}`;

export const PACMAN_SPAWN: Tile = tilesOf(CELL.PACMAN_SPAWN)[0];

/** Every dot on the board: a pellet on each PATH tile, a power pellet on each POWER_PELLET tile. */
export const DOTS = {
  pellets: tilesOf(CELL.PATH),
  power: tilesOf(CELL.POWER_PELLET),
};

/** Arcade fruit: one cherry below the ghost house, appearing when the 70th and 170th dots are eaten. */
export const FRUIT_SPAWN: Tile = { row: 17, col: 13 };
export const FRUIT_AT = [70, 170];

/** Arcade points. ponytail: ghost points (200/400/800/1600) come with frightened mode. */
export const POINTS = { pellet: 10, power: 50, cherry: 100 };

/**
 * Ghost house: the two 3x2 pockets inside the "2" — rows 11-12 (open to the
 * left via col 11) and rows 14-15 (open to the right via col 15). GHOST_SPAWN
 * is the single marker tile at the top of the board (row 7, col 13).
 * No ghosts yet; these exist so the ghost commit has its coordinates.
 */
export const GHOST_HOUSE: Tile[] = tilesOf(CELL.GHOST_HOUSE);
export const GHOST_SPAWN: Tile = tilesOf(CELL.GHOST_SPAWN)[0];

/**
 * Arcade ghosts. `tile`: start (all inside the house), `door`: the tile they
 * head for to get out, `corner`: scatter target (Blinky TR, Pinky TL, Inky BR, Clyde BL).
 */
export const GHOSTS = [
  { name: "blinky", tile: { row: 11, col: 12 }, door: { row: 11, col: 11 }, corner: { row: 0, col: MAZE_COLS - 1 } },
  { name: "pinky", tile: { row: 12, col: 14 }, door: { row: 12, col: 11 }, corner: { row: 0, col: 0 } },
  { name: "inky", tile: { row: 14, col: 12 }, door: { row: 14, col: 15 }, corner: { row: MAZE_ROWS - 1, col: MAZE_COLS - 1 } },
  { name: "clyde", tile: { row: 15, col: 14 }, door: { row: 15, col: 15 }, corner: { row: MAZE_ROWS - 1, col: 0 } },
];
/** Dots eaten before each ghost leaves the house (level 1). ponytail: no 4s no-dot fallback timer. */
const RELEASE = [0, 0, 30, 60];
/** Ghost `i` exists once its release count is met; before that it's not on the board at all. */
export const released = (g: Game, i: number) => g.eaten.size >= RELEASE[i];

export const TICK_MS = 200; // ms per tile: bigger = slower
const SEC = 1000 / TICK_MS;
/** Level-1 mode phases in ticks, scatter first, alternating; chase forever after the last. */
const PHASES = [7, 20, 7, 20, 5, 20, 5].map((s) => s * SEC);
export function scatter(t: number): boolean {
  for (let i = 0; i < PHASES.length; i++) {
    if (t < PHASES[i]) return i % 2 === 0;
    t -= PHASES[i];
  }
  return false;
}

const house = (t: Tile) => MAZE[t.row][t.col] === CELL.GHOST_HOUSE;

/**
 * The tile reached by moving one step from (row, col), or null if a wall (or,
 * unless `houseOk`, the ghost house) blocks it. Stepping off the grid from a
 * teleport endpoint emerges at its partner.
 */
export function step(
  row: number,
  col: number,
  dRow: number,
  dCol: number,
  houseOk = false,
): Tile | null {
  let r = row + dRow;
  let c = col + dCol;
  if (r < 0 || r >= MAZE_ROWS || c < 0 || c >= MAZE_COLS) {
    const partner = TELEPORT_PARTNER.get(`${row},${col}`);
    if (!partner) return null;
    r = partner.y;
    c = partner.x;
  }
  const t = { row: r, col: c };
  return MAZE[r][c] === CELL.WALL || (!houseOk && house(t)) ? null : t;
}

/**
 * Arcade steering: turn into `want` the moment it's open, otherwise carry on in
 * `dir`, otherwise stop against the wall (keeping `dir` so the sprite still faces it).
 */
export function advance(pos: Tile, want: Dir, dir: Dir): { pos: Tile; dir: Dir } {
  const turned = step(pos.row, pos.col, ...want);
  if (turned) return { pos: turned, dir: want };
  return { pos: step(pos.row, pos.col, ...dir) ?? pos, dir };
}

/** `out`: has left the ghost house. `trail`: keys of the last few tiles, avoided so 2-wide corridors don't trap it in a loop. */
export type Ghost = { pos: Tile; dir: Dir; out: boolean; trail: string[] };
/** `eaten` holds dot keys; `fruitTaken` counts cherries collected so far; `t` is the tick count. */
export type Game = {
  pos: Tile;
  dir: Dir;
  eaten: Set<string>;
  fruitTaken: number;
  ghosts: Ghost[];
  t: number;
  score: number;
};

export const NEW_GAME: Game = {
  pos: PACMAN_SPAWN,
  dir: [0, 0],
  eaten: new Set(),
  fruitTaken: 0,
  ghosts: GHOSTS.map((g) => ({ pos: g.tile, dir: [0, 0], out: false, trail: [] })),
  t: 0,
  score: 0,
};

/** A cherry is on the board once the next trigger is reached and until it's taken. */
export const fruitOut = (g: Game) => g.eaten.size >= (FRUIT_AT[g.fruitTaken] ?? Infinity);

/** Dot key -> points. */
const DOT_KEYS = new Map([
  ...DOTS.pellets.map((t) => [key(t), POINTS.pellet] as const),
  ...DOTS.power.map((t) => [key(t), POINTS.power] as const),
]);

/** Arcade tie-break order when two directions are equally close to the target. */
const DIRS: Dir[] = [[-1, 0], [0, -1], [1, 0], [0, 1]];
const dist2 = (a: Tile, b: Tile) => (a.row - b.row) ** 2 + (a.col - b.col) ** 2;
const ahead = (g: Game, n: number): Tile => ({ row: g.pos.row + g.dir[0] * n, col: g.pos.col + g.dir[1] * n });

/** Chase targets, indexed like GHOSTS. ponytail: skips Pinky/Inky's facing-up overflow bug. */
const TARGET: ((g: Game) => Tile)[] = [
  (g) => g.pos,
  (g) => ahead(g, 4),
  (g) => {
    const a = ahead(g, 2), b = g.ghosts[0].pos;
    return { row: 2 * a.row - b.row, col: 2 * a.col - b.col };
  },
  (g) => (dist2(g.pos, g.ghosts[3].pos) > 64 ? g.pos : GHOSTS[3].corner),
];

/** Tiles remembered per ghost: 4 covers a lap of a 2x2 block, the smallest loop on this map. */
const TRAIL = 4;

/**
 * Arcade ghost step: never reverse, take the open neighbour closest (straight
 * line) to `target`, ties broken up > left > down > right. `flip` reverses
 * first (mode change). A ghost that's out may not re-enter the house.
 * Non-arcade: tiles in `trail` are taken only if nothing else is open.
 */
export function moveGhost(g: Ghost, target: Tile, flip = false): Ghost {
  const dir: Dir = flip ? [-g.dir[0], -g.dir[1]] : g.dir;
  let best: { pos: Tile; dir: Dir; fresh: boolean } | undefined;
  for (const d of DIRS) {
    if (d[0] === -dir[0] && d[1] === -dir[1]) continue;
    const pos = step(g.pos.row, g.pos.col, d[0], d[1], !g.out);
    if (!pos) continue;
    const fresh = !g.trail.includes(key(pos));
    const better = !best || (fresh && !best.fresh) || (fresh === best.fresh && dist2(pos, target) < dist2(best.pos, target));
    if (better) best = { pos, dir: d, fresh };
  }
  if (!best) return { ...g, dir }; // boxed in: turn around, move next tick
  const trail = [key(g.pos), ...g.trail].slice(0, TRAIL);
  return { pos: best.pos, dir: best.dir, out: g.out || !house(best.pos), trail };
}

/** One tick: move Pac-Man, eat whatever he landed on, then move the ghosts. */
export function tick(g: Game, want: Dir): Game {
  const { pos, dir } = advance(g.pos, want, g.dir);
  const k = key(pos);
  const dot = g.eaten.has(k) ? 0 : (DOT_KEYS.get(k) ?? 0);
  const eaten = dot ? new Set(g.eaten).add(k) : g.eaten;
  const fruit = fruitOut(g) && k === key(FRUIT_SPAWN);
  const fruitTaken = g.fruitTaken + (fruit ? 1 : 0);
  const score = g.score + dot + (fruit ? POINTS.cherry : 0);
  const t = g.t + 1;
  const next = { ...g, pos, dir, eaten, fruitTaken, score, t };
  const flip = scatter(t) !== scatter(g.t);
  const ghosts = g.ghosts.map((gh, i) => {
    if (!gh.out && !released(next, i)) return gh;
    const target = !gh.out ? GHOSTS[i].door : scatter(t) ? GHOSTS[i].corner : TARGET[i](next);
    return moveGhost(gh, target, flip);
  });
  return { ...next, ghosts };
}
