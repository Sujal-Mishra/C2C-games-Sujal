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

/**
 * Ghost house: the two 3x2 pockets inside the "2" — rows 11-12 (open to the
 * left via col 11) and rows 14-15 (open to the right via col 15). GHOST_SPAWN
 * is the single marker tile at the top of the board (row 7, col 13).
 * No ghosts yet; these exist so the ghost commit has its coordinates.
 */
export const GHOST_HOUSE: Tile[] = tilesOf(CELL.GHOST_HOUSE);
export const GHOST_SPAWN: Tile = tilesOf(CELL.GHOST_SPAWN)[0];

/**
 * The tile reached by moving one step from (row, col), or null if a wall blocks
 * it. Stepping off the grid from a teleport endpoint emerges at its partner.
 */
export function step(
  row: number,
  col: number,
  dRow: number,
  dCol: number,
): Tile | null {
  let r = row + dRow;
  let c = col + dCol;
  if (r < 0 || r >= MAZE_ROWS || c < 0 || c >= MAZE_COLS) {
    const partner = TELEPORT_PARTNER.get(`${row},${col}`);
    if (!partner) return null;
    r = partner.y;
    c = partner.x;
  }
  return MAZE[r][c] === CELL.WALL ? null : { row: r, col: c };
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

/** `eaten` holds dot keys; `fruitTaken` counts cherries collected so far. */
export type Game = { pos: Tile; dir: Dir; eaten: Set<string>; fruitTaken: number };

export const NEW_GAME: Game = { pos: PACMAN_SPAWN, dir: [0, 0], eaten: new Set(), fruitTaken: 0 };

/** A cherry is on the board once the next trigger is reached and until it's taken. */
export const fruitOut = (g: Game) => g.eaten.size >= (FRUIT_AT[g.fruitTaken] ?? Infinity);

const DOT_KEYS = new Set([...DOTS.pellets, ...DOTS.power].map(key));

/** One tick: move Pac-Man, then eat whatever he landed on. */
export function tick(g: Game, want: Dir): Game {
  const { pos, dir } = advance(g.pos, want, g.dir);
  const k = key(pos);
  const eaten = DOT_KEYS.has(k) && !g.eaten.has(k) ? new Set(g.eaten).add(k) : g.eaten;
  const fruitTaken = g.fruitTaken + (fruitOut(g) && k === key(FRUIT_SPAWN) ? 1 : 0);
  return { pos, dir, eaten, fruitTaken };
}
