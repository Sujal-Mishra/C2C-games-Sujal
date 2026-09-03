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

/** Fruit slot below the ghost house: a grape (the only fruit, there's one level), appearing when the 70th and 170th dots are eaten. */
export const FRUIT_SPAWN: Tile = { row: 17, col: 13 };
export const FRUIT_AT = [70, 170];

/** Arcade points; the grape keeps the level-1 cherry's 100. */
export const POINTS = { pellet: 10, power: 50, grape: 100, ghost: 200 };
/** Three Pac-Men per game; one bonus life at 10,000 points. The cherry is points only. */
export const LIVES = 3;
export const EXTRA_LIFE_AT = 10_000;

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
/** Dots eaten before each ghost leaves the house (level 1). */
const RELEASE = [0, 0, 30, 60];
/** After a death the arcade counts dots from the reset instead, with these thresholds. */
const RELEASE_AFTER_DEATH = [0, 7, 17, 32];
/** Ghost `i` exists once its release count is met or the no-dot timer freed it; before that it's not on the board at all. */
export const released = (g: Game, i: number) =>
  i < g.freed || g.eaten.size - g.since >= (g.since ? RELEASE_AFTER_DEATH : RELEASE)[i]; // ponytail: a death at 0 dots keeps the start table

export const TICK_MS = 200; // ms per tile: bigger = slower
const SEC = 1000 / TICK_MS;
/** Level-1 arcade: 4s without a dot lets the next ghost out anyway. */
const RELEASE_IDLE = 4 * SEC;
/** The fruit leaves the board after 9s if it isn't eaten. */
export const FRUIT_TICKS = 9 * SEC;
/** Level-1 mode phases in ticks, scatter first, alternating; chase forever after the last. */
const PHASES = [7, 20, 7, 20, 5, 20, 5].map((s) => s * SEC);
/** Frightened lasts 6s at level 1, flashing white for the last 2s. */
export const FRIGHT = { ticks: 6 * SEC, flash: 2 * SEC };
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

/**
 * `out`: has left the ghost house. `trail`: keys of the last few tiles, avoided so 2-wide corridors don't trap it in a loop.
 * `mode`: `scared` after a power pellet, `eyes` once eaten (running home to regenerate).
 */
export type Ghost = { pos: Tile; dir: Dir; out: boolean; trail: string[]; mode: "normal" | "scared" | "eyes" };
/** `eaten` holds dot keys; `t` is the tick count. */
export type Game = {
  pos: Tile;
  dir: Dir;
  eaten: Set<string>;
  /** Ticks the fruit stays on the board; 0 = no fruit out. */
  fruit: number;
  /** Fruits that have appeared so far (eaten or timed out), indexing FRUIT_AT. */
  fruits: number;
  /** Ticks since the last dot, for the release timer. */
  idle: number;
  /** Ghosts let out by the release timer regardless of dots: indexes below this are released. */
  freed: number;
  ghosts: Ghost[];
  t: number;
  /** Scatter/chase clock in ticks: like `t` but paused while the ghosts are frightened, as the arcade does. */
  clock: number;
  score: number;
  /** Frightened ticks left; 0 = normal. */
  fright: number;
  /** Pac-Men left including the one in play; 0 = game over. */
  lives: number;
  /** Dots eaten at the last death, for the after-death release table. */
  since: number;
  /** The 10,000-point life has been awarded. */
  bonus: boolean;
  /** Ghosts eaten on the current power pellet: 200, 400, 800, 1600. */
  combo: number;
  /** A ghost was just eaten: the board freezes for `left` ticks showing `points` at `pos`. */
  bite: { pos: Tile; points: number; left: number } | null;
};

export const NEW_GAME: Game = {
  pos: PACMAN_SPAWN,
  dir: [0, 0],
  eaten: new Set(),
  fruit: 0,
  fruits: 0,
  idle: 0,
  freed: 0,
  ghosts: GHOSTS.map((g) => ({ pos: g.tile, dir: [0, 0], out: false, trail: [], mode: "normal" })),
  t: 0,
  clock: 0,
  score: 0,
  fright: 0,
  lives: LIVES,
  since: 0,
  bonus: false,
  combo: 0,
  bite: null,
};

export const fruitOut = (g: Game) => g.fruit > 0;

/** Dot key -> points. */
const DOT_KEYS = new Map([
  ...DOTS.pellets.map((t) => [key(t), POINTS.pellet] as const),
  ...DOTS.power.map((t) => [key(t), POINTS.power] as const),
]);

/** Every dot eaten: the one level is done. */
export const cleared = (g: Game) => g.eaten.size === DOT_KEYS.size;

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
 * `target: null` is frightened: a random open direction instead.
 * Non-arcade: tiles in `trail` are taken only if nothing else is open.
 */
export function moveGhost(g: Ghost, target: Tile | null, flip = false): Ghost {
  const dir: Dir = flip ? [-g.dir[0], -g.dir[1]] : g.dir;
  const open = DIRS.flatMap((d) => {
    if (d[0] === -dir[0] && d[1] === -dir[1]) return [];
    const pos = step(g.pos.row, g.pos.col, d[0], d[1], !g.out);
    return pos ? [{ pos, dir: d, fresh: !g.trail.includes(key(pos)) }] : [];
  });
  if (!open.length) return { ...g, dir }; // boxed in: turn around, move next tick
  let best = open[Math.floor(Math.random() * open.length)];
  if (target)
    for (const c of open) {
      const better = (c.fresh && !best.fresh) || (c.fresh === best.fresh && dist2(c.pos, target) < dist2(best.pos, target));
      if (c === open[0] || better) best = c;
    }
  const trail = [key(g.pos), ...g.trail].slice(0, TRAIL);
  return { ...g, pos: best.pos, dir: best.dir, out: g.out || !house(best.pos), trail };
}

/** Next tile on a shortest path (BFS, house allowed). ponytail: greedy steering loops on this map's side-opening house, so eyes path-find. */
function towards(from: Tile, to: Tile): Tile | null {
  const prev = new Map<string, Tile | null>([[key(from), null]]);
  const queue = [from];
  for (let i = 0; i < queue.length; i++) {
    const t = queue[i];
    if (key(t) === key(to)) {
      let cur = t, back: Tile | null | undefined;
      while ((back = prev.get(key(cur))) && key(back) !== key(from)) cur = back;
      return cur;
    }
    for (const d of DIRS) {
      const n = step(t.row, t.col, d[0], d[1], true);
      if (n && !prev.has(key(n))) { prev.set(key(n), t); queue.push(n); }
    }
  }
  return null;
}

/** Eyes run home at double speed and regenerate on their start tile, leaving the house again unfrightened. */
function goHome(gh: Ghost, i: number): Ghost {
  for (let n = 0; n < 2; n++) {
    if (key(gh.pos) === key(GHOSTS[i].tile)) return { ...gh, mode: "normal", out: false, trail: [] };
    const pos = towards(gh.pos, GHOSTS[i].tile) ?? gh.pos;
    gh = { ...gh, pos, dir: [Math.sign(pos.row - gh.pos.row), Math.sign(pos.col - gh.pos.col)] };
  }
  return gh;
}

/** Arcade collision: same tile as an unfrightened ghost. ponytail: swapping tiles in one tick passes through, as the arcade does. */
const caught = (g: Game) => g.ghosts.some((gh) => gh.out && gh.mode === "normal" && key(gh.pos) === key(g.pos));

/** One tick: move Pac-Man, eat whatever he landed on, move the ghosts, then check for a bite or a death. */
export function tick(g: Game, want: Dir): Game {
  if (!g.lives || cleared(g)) return g; // game over or completed
  if (g.bite) return { ...g, bite: g.bite.left > 1 ? { ...g.bite, left: g.bite.left - 1 } : null }; // everything freezes, fright clock included
  const { pos, dir } = advance(g.pos, want, g.dir);
  const k = key(pos);
  const dot = g.eaten.has(k) ? 0 : (DOT_KEYS.get(k) ?? 0);
  const eaten = dot ? new Set(g.eaten).add(k) : g.eaten;
  const grape = fruitOut(g) && k === key(FRUIT_SPAWN);
  // The fruit counts down while out; the next one appears once its dot trigger is reached and no fruit is out.
  let fruit = grape ? 0 : Math.max(0, g.fruit - 1), fruits = g.fruits;
  if (!fruit && eaten.size >= (FRUIT_AT[fruits] ?? Infinity)) { fruit = FRUIT_TICKS; fruits++; }
  const score = g.score + dot + (grape ? POINTS.grape : 0);
  const bonus = g.bonus || score >= EXTRA_LIFE_AT;
  const lives = g.lives + (bonus && !g.bonus ? 1 : 0);
  const t = g.t + 1;
  const power = dot === POINTS.power;
  const fright = power ? FRIGHT.ticks : Math.max(0, g.fright - 1);
  const clock = fright ? g.clock : g.clock + 1;
  // 4s without a dot frees the next ghost still waiting in the house.
  let idle = dot ? 0 : g.idle + 1, freed = g.freed;
  const waiting = GHOSTS.findIndex((_, i) => !released(g, i));
  if (idle >= RELEASE_IDLE && waiting >= 0) { idle = 0; freed = waiting + 1; }
  const next = { ...g, pos, dir, eaten, fruit, fruits, score, bonus, lives, t, clock, fright, idle, freed, combo: power ? 0 : g.combo };
  if (cleared(next)) return next; // last dot: the ghosts don't get a move on it
  // A power pellet, like a mode switch, turns every ghost around.
  const flip = scatter(clock) !== scatter(g.clock) || power;
  const ghosts = g.ghosts.map((gh, i) => {
    if (gh.mode === "eyes") return goHome(gh, i);
    const scared = power || (gh.mode === "scared" && fright > 0);
    gh = { ...gh, mode: scared ? "scared" : "normal" };
    if (!gh.out && !released(next, i)) return gh;
    if (scared && !power && t % 2) return gh; // frightened ghosts crawl at half speed
    const target = !gh.out ? GHOSTS[i].door : scared ? null : scatter(clock) ? GHOSTS[i].corner : TARGET[i](next);
    return moveGhost(gh, target, flip);
  });
  const after = { ...next, ghosts };
  const bit = ghosts.findIndex((gh) => gh.mode === "scared" && key(gh.pos) === k);
  if (bit >= 0) {
    const points = POINTS.ghost << g.combo;
    const eyes = ghosts.map((gh, i) => (i === bit ? { ...gh, mode: "eyes" as const } : gh));
    return { ...after, ghosts: eyes, score: score + points, combo: g.combo + 1, bite: { pos, points, left: SEC } };
  }
  if (!caught(after)) return after;
  // Death: everyone back to their start tiles, mode clock and fright reset; dots and score stay.
  return { ...after, lives: lives - 1, since: eaten.size, pos: PACMAN_SPAWN, dir: [0, 0], ghosts: NEW_GAME.ghosts, t: 0, clock: 0, fright: 0, idle: 0, freed: 0 };
}
