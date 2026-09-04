import level from "../level.json" with { type: "json" };

/** Cell codes used by the level editor export in `level.json`. */
export const CELL = {
  /** Off-board filler the editor writes around the maze: never walkable, never drawn. */
  VOID: 0,
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

/** True while `t` is inside the ghost house (Pac-Man can never enter; ghosts can, until they've left it once). */
export const house = (t: Tile) => MAZE[t.row][t.col] === CELL.GHOST_HOUSE;

/**
 * The tile reached by moving one step from (row, col), or null if the grid edge,
 * a wall, off-board filler or (unless `houseOk`) the ghost house blocks it.
 *
 * Stepping onto a teleport mouth emerges at its partner, so a pair works wherever
 * it sits: the endpoints need not be on the border, and need not face each other.
 * You never come to rest on a mouth, so arriving at one can't bounce you back.
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
  if (r < 0 || r >= MAZE_ROWS || c < 0 || c >= MAZE_COLS) return null;
  const partner = MAZE[r][c] === CELL.TELEPORT && TELEPORT_PARTNER.get(`${r},${c}`);
  if (partner) {
    r = partner.y;
    c = partner.x;
  }
  const t = { row: r, col: c };
  const blocked = MAZE[r][c] === CELL.WALL || MAZE[r][c] === CELL.VOID;
  return blocked || (!houseOk && house(t)) ? null : t;
}

/**
 * Resolve Pac-Man's next tile and facing from what the player wants and where
 * he's already going.
 *
 * Arcade Pac-Man doesn't stop-and-turn: he keeps going until the wanted turn
 * opens up, takes it instantly, and if nothing's open stops but keeps facing the
 * way he was headed. `on` is where carrying straight on lands (null if that's a
 * wall). `want` is taken only if it is a real direction, `step` finds it open,
 * and it isn't a straight reversal — so he turns only where the maze offers a
 * turn and never doubles back mid-corridor. A `want` of [0, 0] means "nothing
 * asked for" (no key yet, or the press aged out — see TURN_BUFFER) and falls
 * through to the same carry-on.
 *
 * Refusing the reversal is stricter than the arcade, where a 180 is always legal.
 * The exception is `on === null` — nose against a wall, going nowhere — because a
 * player who has just run into a wall and asks to go back is owed an answer;
 * anywhere else he is moving, so "only at a turn" still holds.
 */
export function advance(pos: Tile, want: Dir, dir: Dir): { pos: Tile; dir: Dir } {
  const on = step(pos.row, pos.col, ...dir);
  const back = want[0] === -dir[0] && want[1] === -dir[1];
  const turned = (want[0] || want[1]) && (!back || !on) ? step(pos.row, pos.col, ...want) : null;
  if (turned) return { pos: turned, dir: want };
  return { pos: on ?? pos, dir };
}
