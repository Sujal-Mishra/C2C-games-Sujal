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

export const PACMAN_SPAWN: Tile = (() => {
  const row = MAZE.findIndex((line) => line.includes(CELL.PACMAN_SPAWN));
  return { row, col: MAZE[row].indexOf(CELL.PACMAN_SPAWN) };
})();

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
