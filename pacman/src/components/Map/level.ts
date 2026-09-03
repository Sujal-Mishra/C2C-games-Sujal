import level from "./level.json" with { type: "json" };

/**
 * The integer vocabulary of a maze cell.
 *
 * What: a const object; its value type is narrowed to the literal union
 * {@link CellCode}.
 * Used by: {@link isWall}, {@link tilesOf}, {@link step}, the `house` helper,
 * and `drawMaze` in `Map.tsx` — anywhere a raw cell value is compared.
 */
export const CELL = {
  PATH: 1,
  WALL: 2,
  GHOST_HOUSE: 3,
  TELEPORT: 4,
  POWER_PELLET: 5,
  PACMAN_SPAWN: 6,
  GHOST_SPAWN: 7,
} as const;

/**
 * The union of every legal cell code, i.e. `1 | 2 | 3 | 4 | 5 | 6 | 7`.
 *
 * Why: lets `MAZE` and `tilesOf`'s argument be typed precisely instead of
 * `number`, so an out-of-range comparison is caught at compile time.
 * Used by: {@link MAZE}'s element type and {@link tilesOf}'s parameter.
 */
export type CellCode = (typeof CELL)[keyof typeof CELL];

/**
 * The maze grid: `MAZE[row][col]` is a {@link CellCode}.
 */
export const MAZE: readonly (readonly CellCode[])[] = level.map as CellCode[][];

/**
 * Board height / width in tiles.
 *
 * Used by: {@link isWall}/{@link step} bounds checks, the corner coordinates in
 * {@link GHOSTS}, and the `<canvas>` `width`/`height` in `Map.tsx`.
 */
export const MAZE_ROWS = MAZE.length;
export const MAZE_COLS = MAZE[0].length;

/**
 * The tunnel pairs: each entry's `endpoints` are the two `{x: col, y: row}`
 * openings that warp to each other.
 *
 * Why: Pac-Man and the ghosts leaving one side of the board must reappear on
 * the other; this is the authored list of which hole connects to which.
 * Used by: `TELEPORT_PARTNER` (built below) and re-exported for completeness.
 */
export const TELEPORTS = level.teleports;

/**
 * How many ghosts this level runs with (4).
 *
 * Why: lets a consumer know the ghost count without importing the whole
 * {@link GHOSTS} table.
 */
export const NUM_GHOSTS = level.numGhosts;

/**
 * Is the tile at (row, col) a solid wall?
 *
 * How: bounds-check first; anything off the grid returns `false` (treated as
 * open). Otherwise compare the cell to `CELL.WALL`.
 * Used by: `drawWall` in `Map.tsx` (which sides to stroke) and — indirectly —
 * every movement path, since {@link step} rejects `CELL.WALL`.
 */
export function isWall(row: number, col: number): boolean {
  if (row < 0 || row >= MAZE_ROWS || col < 0 || col >= MAZE_COLS) return false;
  return MAZE[row][col] === CELL.WALL;
}

/**
 * `"row,col"` of a teleport endpoint -> the `{x, y}` of its partner endpoint.
 * basically given an input tp point it gives the other point it should come out of
 *
 * Used by: {@link step} only.
 */
const TELEPORT_PARTNER = new Map(
  TELEPORTS.flatMap(({ endpoints: [a, b] }) => [
    [`${a.y},${a.x}`, b],
    [`${b.y},${b.x}`, a],
  ] as const),
);

/**
 * A board position by grid coordinate.
 *
 * What: `{ row, col }`, i.e. `{ y, x }` in screen terms.
 */
export type Tile = { row: number; col: number };

/**
 * A one-tile movement delta as `[dRow, dCol]` — "d" for delta, i.e. how much
 * one step changes the row and the column. `[0, 0]` means "not moving".
 *
 * Why: directions need to be added to tiles, negated (reverse), and used as
 * map keys — a fixed-length numeric pair does all three cheaply.
 * What: a `readonly [number, number]` tuple. `row` grows downward and `col`
 * grows rightward, so only these 5 values ever occur:
 *
 *     [-1,  0]  up      (row - 1, col unchanged)
 *     [ 1,  0]  down    (row + 1, col unchanged)
 *     [ 0, -1]  left    (col - 1, row unchanged)
 *     [ 0,  1]  right   (col + 1, row unchanged)
 *     [ 0,  0]  stopped (nothing changes)
 *
 * Used by: {@link MVMT_DELTAS} (the four non-zero values, in tie-break order),
 * `advance`, {@link moveGhost}, {@link step}; the `KEYS` and `FACE` tables in
 * `Map.tsx`; `Game.dir`, `Ghost.dir`.
 */
export type MovementDelta = readonly [number, number];

/**
 * Every tile in the maze that holds `code`, scanned in row-major order.
 *
 * Why: the board is authored as a grid, but the game wants lists — "all pellet
 * tiles", "all ghost-house tiles", "the Pac-Man spawn". This inverts the grid
 * once per category.
 * Used by: {@link PACMAN_SPAWN}, {@link DOTS}, {@link GHOST_HOUSE},
 * {@link GHOST_SPAWN} — all computed at module load.
 */
export function tilesOf(code: CellCode): Tile[] {
  return MAZE.flatMap((line, row) =>
    line.flatMap((cell, col) => (cell === code ? [{ row, col }] : [])),
  );
}

/**
 * Canonical string id for a tile: `"row,col"`.
 *
 * Why: `Set`/`Map` compare objects by reference, so tiles can't be keys
 * directly; the game needs value equality to ask "have I eaten this dot?",
 * "is a ghost on my tile?", "have I been here recently?".
 * Used by: `eaten`/`DOT_KEYS` (dots), `Ghost.trail`, collision checks in
 * `tick`/`caught`, `TELEPORT_PARTNER`, and React `key`s in `Map.tsx`.
 */
export const key = (t: Tile) => `${t.row},${t.col}`;

/**
 * Where Pac-Man starts (and respawns after a death).
 */
export const PACMAN_SPAWN: Tile = tilesOf(CELL.PACMAN_SPAWN)[0];

/**
 * Every collectible on the board, split by kind.
 *
 * Why: rendering needs the full list to draw dots; the sim needs it to score
 * them and to know when the level is clear.
 * Used by: `Map.tsx` (draw remaining dots), and `DOT_KEYS` / {@link cleared}
 * (scoring and level-complete).
 */
export const DOTS = {
  pellets: tilesOf(CELL.PATH),
  power: tilesOf(CELL.POWER_PELLET),
};

/**
 * The bonus-fruit slot and its spawn triggers.
 *
 * Why: the arcade drops a fruit under the ghost house twice per level for bonus
 * points; the game needs to know *where* it lands and *when* it appears.
 * Used by: {@link tick} (spawn/despawn/scoring) and `Map.tsx` (draw the
 * cherry).
 */
export const FRUIT_SPAWN: Tile = { row: 17, col: 13 };

/**
 * The two dot counts that trigger a fruit spawn (70 and 170, level 1).
 */
export const FRUIT_AT = [70, 170];

/**
 * Points awarded, matching the original level-1 table.
 *
 * Used by: {@link tick} (all scoring) and `DOT_KEYS`.
 */
export const POINTS = { pellet: 10, power: 50, cherry: 100, ghost: 200 };

/**
 * Starting lives (3) and the score at which a bonus life is granted (10,000).

 * Used by: {@link NEW_GAME} (`LIVES`), {@link tick} (`EXTRA_LIFE_AT`),
 * `Map.tsx` (life pips = `lives - 1`).
 */
export const LIVES = 3;

/**
 * At how many points we get an extra life
 */
export const EXTRA_LIFE_AT = 10_000;

/**
 * Every ghost-house tile, and the single ghost-spawn marker.
 *
 * Why: the house is a no-go zone for a ghost that has already left (and for
 * Pac-Man), and the sim needs its extent to enforce that; `GHOST_SPAWN` is kept
 * as a distinct marker tile for future use.
 * Used by: the `house` helper (which drives {@link step}/{@link moveGhost}
 * house rules) and `Map.tsx`'s in-house bob direction; `GHOST_SPAWN` is
 * currently re-exported only.
 */
export const GHOST_HOUSE: Tile[] = tilesOf(CELL.GHOST_HOUSE);
export const GHOST_SPAWN: Tile = tilesOf(CELL.GHOST_SPAWN)[0];

/**
 * Per-ghost fixed data: identity, start tile, house exit, and scatter corner.
 *
 * How: index order is blinky, pinky, inky, clyde — the same order used
 * everywhere (`NEW_GAME.ghosts`, `TARGET`, `RELEASE`, the render loop).
 *
 * Fields, per entry:
 * - `name`:   sprite identity. `Map.tsx` builds the image path from it
 *             (`/ghosts/${name}.svg` and friends) and it is the label used when
 *             talking about a specific ghost. Never changes at runtime.
 * - `tile`:   the ghost's seat *inside* the house — where it starts the level
 *             and where it respawns after being eaten. `goHome` routes eyes
 *             back to this tile; {@link NEW_GAME} seeds `ghost.at` from it.
 *             Blinky's is on the door row, so he effectively starts already
 *             leaving; the other three sit a row deeper.
 * - `door`:   the aim point for *getting out*. A caged ghost steers toward this
 *             tile (just outside the pocket) to climb out through the house
 *             gap; once it reaches `door` it is on the open maze and normal
 *             targeting takes over. Also the last waypoint `goHome` uses on the
 *             way back in.
 * - `corner`: the scatter target — the tile this ghost runs at during every
 *             scatter phase, one per screen quadrant so the four fan out:
 *             Blinky top-right, Pinky top-left, Inky bottom-right, Clyde
 *             bottom-left. {@link scatter} returns this; {@link TARGET} falls
 *             back to it. Expressed with `MAZE_ROWS/COLS - 1` so it tracks the
 *             real board size rather than a magic number.
 *
 * Used by: {@link NEW_GAME}, {@link released}, {@link tick} (targets, exits),
 * `goHome` (regen tile), and `Map.tsx` (`GHOSTS[i].name` -> sprite path).
 */
export const GHOSTS = [
  { name: "blinky", tile: { row: 11, col: 12 }, door: { row: 11, col: 11 }, corner: { row: 0, col: MAZE_COLS - 1 } },
  { name: "pinky", tile: { row: 12, col: 14 }, door: { row: 12, col: 11 }, corner: { row: 0, col: 0 } },
  { name: "inky", tile: { row: 14, col: 12 }, door: { row: 14, col: 15 }, corner: { row: MAZE_ROWS - 1, col: MAZE_COLS - 1 } },
  { name: "clyde", tile: { row: 15, col: 14 }, door: { row: 15, col: 15 }, corner: { row: MAZE_ROWS - 1, col: 0 } },
];

/**
 * Dots-eaten thresholds that let each ghost out of the house, level 1.
 *
 * Why: the arcade staggers ghost releases so they don't all pour out at once;
 * Blinky and Pinky are immediate, Inky waits for 30 dots, Clyde for 60.
 * How: indexed like {@link GHOSTS}; read by {@link released} while `Game.since`
 * is 0 (no death yet this life).
 */
const RELEASE = [0, 0, 30, 60];

/**
 * Dots-since-reset thresholds used *after* a death instead of {@link RELEASE}.
 *
 * Why: the real machine, after Pac-Man dies, stops counting total dots and
 * counts dots eaten since the reset, with a tighter table (0/7/17/32) so the
 * board re-populates with ghosts at a sensible pace.
 * How: {@link released} picks this table when `Game.since > 0`, measuring
 * `eaten.size - since`.
 */
const RELEASE_AFTER_DEATH = [0, 7, 17, 32];

/**
 * Is ghost `i` on the board yet?
 *
 * Why: a ghost still waiting in the house isn't simulated or drawn as a mover
 * (it only bobs); the release rule decides the moment it "exists".
 * How: true if the idle timer already freed it (`i < g.freed`), or the
 * appropriate dots threshold is met — {@link RELEASE_AFTER_DEATH} measured from
 * the last death when `g.since` is set, otherwise {@link RELEASE} on total
 * dots.
 * Used by: {@link tick} (whether to move ghost `i`, and the idle-timer's
 * "who's next" scan) and `Map.tsx` (bob vs. move rendering).
 */
export const released = (g: Game, i: number) =>
  i < g.freed || g.eaten.size - g.since >= (g.since ? RELEASE_AFTER_DEATH : RELEASE)[i]; // ponytail: a death at 0 dots keeps the start table

/**
 * Milliseconds per sim tick: one arcade frame (60 Hz).
 *
 * Why: the arcade's speed tables are in fractions of a pixel per *frame*, and a
 * tick is now a frame, not a tile — every mover banks a fraction of a tile
 * each tick and steps when a whole tile is banked (see {@link SPEED}). Running
 * the sim at frame rate is what lets Pac-Man, ghosts, tunnels and Elroy all
 * move at different speeds on a tile grid without jitter.
 * Used by: `Map.tsx`'s tick loop; `SEC`, `FULL` and everything downstream.
 */
export const TICK_MS = 1000 / 60;

/**
 * Ticks per second — the conversion factor from seconds to ticks.
 *
 * Why: the arcade tables are in seconds; the sim counts in ticks. Defining this
 * once lets the phase/fright/fruit constants read as `7 * SEC` etc.
 */
const SEC = 1000 / TICK_MS;

/**
 * Tiles moved per tick at 100% speed.
 *
 * Why: the Pac-Man Dossier pins 100% at 75.7576 px/s over 8-px tiles, i.e.
 * ≈9.47 tiles/s or ≈105.6 ms per tile; everything in {@link SPEED} is a
 * percentage of this. `PACE` scales the whole game (0.75 ≈ 25% slower than the
 * arcade, which felt too quick on this board) without touching the relative
 * speeds.
 */
const PACE = 0.8 * 0.94;
const FULL = (75.7576 / 8) * (TICK_MS / 1000) * PACE;

/**
 * Level-1 movement speeds, as percentages of {@link FULL} (Pac-Man Dossier,
 * table A.1).
 *
 * Why: the arcade's feel comes from *relative* speeds — Pac-Man outruns the
 * ghosts on open track but a 1-frame stop per dot (`stall`) lets a chaser
 * close in, ghosts crawl through the tunnel, frightened ghosts are slow and
 * Pac-Man is quick, and Blinky becomes "Cruise Elroy" near the end.
 * What, per field:
 *  - `pacman` / `pacmanFright`: Pac-Man normally / while ghosts are frightened.
 *    Both are scaled by {@link PACMAN_BOOST} before use; the values here stay
 *    the arcade's.
 *  - `ghost`: any ghost on the open maze (also used while leaving the house).
 *  - `tunnel`: a ghost within {@link TUNNEL_REACH} tiles of a teleport; Pac-Man
 *    is unaffected. Overrides everything but `eyes`.
 *  - `fright`: a frightened (edible) ghost.
 *  - `eyes`: an eaten ghost racing home. Not in the Dossier; ≈2 px/frame as in
 *    the frame-accurate reimplementations.
 *  - `elroy`: `[dotsLeft, speed]` pairs, most urgent first — Blinky's speed
 *    once at most that many dots remain (20 -> 80%, 10 -> 85%), suspended after
 *    a death until Clyde has left the house, as in the arcade.
 *  - `stall`: frames Pac-Man stops for on eating a pellet / a power pellet
 *    (1 / 3). This is what turns his 80% into the Dossier's "~71% on dots".
 * Later levels (2-4: Pac-Man 90/79, ghosts 85, tunnel 45, fright 95/55;
 * 5-20: 100/87, 95, 50, 100/60) are documented here for when levels exist.
 * Used by: {@link tick} via `rate`; `Map.tsx` doesn't need it.
 */
export const SPEED = {
  pacman: 80,
  pacmanFright: 90,
  ghost: 75,
  tunnel: 40,
  fright: 50,
  eyes: 160,
  elroy: [[10, 85], [20, 80]] as const,
  stall: { [POINTS.pellet]: 1, [POINTS.power]: 3 } as Record<number, number>,
};

/**
 * Percent of full speed -> tiles per tick.
 */
const rate = (pct: number) => (pct / 100) * FULL;

/**
 * Pac-Man's own speed multiplier, on top of his {@link SPEED} percentages.
 *
 * Why: at the Dossier's 80% he reads as sluggish on this board — the tiles are
 * big and the corridors short, so a tile-step takes a beat longer than the eye
 * expects. 7% is enough to feel responsive.
 * How: kept separate from {@link SPEED} so that table stays a faithful copy of
 * the arcade's and this stays a visible, revertable decision — the same
 * reasoning as {@link PACE}, but for the player alone: the ghosts keep their
 * arcade speeds, so this also widens the gap he can open on a chaser.
 * Used by: {@link pacmanRate}, and so both places his speed is banked.
 */
const PACMAN_BOOST = 1.07;

/**
 * Tiles per tick for Pac-Man: {@link rate} with {@link PACMAN_BOOST} applied.
 *
 * Used by: {@link TILE_TICKS} and {@link tick}. Ghosts use plain {@link rate}.
 */
const pacmanRate = (pct: number) => rate(pct) * PACMAN_BOOST;

/**
 * Ticks Pac-Man takes to cross one dotted tile: the time to bank a whole tile
 * at his normal speed, plus the frame he stops for on the pellet.
 *
 * Used by: {@link TURN_BUFFER}, which is measured in tiles of travel — so the
 * buffer tracks {@link PACMAN_BOOST} instead of drifting out of step with it.
 */
const TILE_TICKS = 1 / pacmanRate(SPEED.pacman) + SPEED.stall[POINTS.pellet];

/**
 * How long (in ticks) a tapped direction stays live, waiting for a turn to
 * open up.
 *
 * Why: Pac-Man only changes direction on a tile boundary, and those are
 * {@link TILE_TICKS} (~12 frames) apart — asking the player to hit the key on
 * the exact frame he reaches the corner would be miserable. So a press is
 * remembered for a moment and taken at the first boundary that allows it.
 * *Holding* the key asks indefinitely (see `useGame` in `Map.tsx`); this
 * window is for a tap.
 * How: two tiles of travel. A turn is decided as he *leaves* a tile, so a
 * press made anywhere along the tile before a corner has to survive up to two
 * boundaries to be taken — that's the two. Beyond it the press is dropped, so
 * he carries straight on instead of veering down some corridor the player
 * asked for half a second ago.
 * Used by: `useGame` in `Map.tsx`, which stops handing an expired press to
 * {@link tick}.
 */
export const TURN_BUFFER = Math.ceil(2 * TILE_TICKS);

/**
 * How far (in tiles, along the row) from a teleport mouth a ghost is still
 * "in the tunnel" and slowed to `SPEED.tunnel`.
 *
 * Why: the arcade slows ghosts for the whole side corridor, not just the
 * off-screen tile; this map's corridors are short, so 2 covers the stretch
 * before the first side opening.
 */
const TUNNEL_REACH = 2;

/**
 * Is this tile in a tunnel slow zone? See {@link TUNNEL_REACH}.
 *
 * Used by: `rate`-selection in {@link tick}.
 */
const tunnel = (t: Tile) =>
  TELEPORTS.some(({ endpoints }) => endpoints.some((e) => e.y === t.row && Math.abs(e.x - t.col) <= TUNNEL_REACH));

/**
 * Ticks of no-dot-eaten that force the next waiting ghost out (4s, level 1).
 *
 * Why: without this, a player who stops eating could stall ghost releases
 * forever; the arcade has the same safety valve.
 */
const RELEASE_IDLE = 4 * SEC;

/**
 * How long a spawned fruit stays on the board before vanishing (9s).
 *
 * Used by: {@link tick}; re-exported for anyone displaying a timer.
 */
export const FRUIT_TICKS = 9 * SEC;

/**
 * The scatter/chase schedule for level 1, in ticks.
 *
 * Why: ghosts alternate between "scatter" (run to your corner) and "chase"
 * (hunt Pac-Man) on a fixed timetable; this is that timetable, 7s/20s/7s/20s/
 * 5s/20s/5s, then chase forever.
 */
const PHASES = [7, 20, 7, 20, 5, 20, 5].map((s) => s * SEC);

/**
 * Frightened-mode timing (level 1): 6s total, the last 2s flashing white.
 *
 * Why: eating a power pellet makes ghosts vulnerable for a bounded window with
 * a visual warning as it runs out.
 * Used by: {@link tick} (state) and `Map.tsx` (sprite choice).
 */
export const FRIGHT = { ticks: 6 * SEC, flash: 2 * SEC };

/**
 * Given the mode clock, are the ghosts scattering (vs. chasing) right now?
 *
 * Why: {@link tick} needs a single query to pick each ghost's target and to
 * detect a phase change (which turns every ghost around).
 * Used by: {@link tick} — both to choose targets and, by comparing
 * `scatter(clock)` before/after, to trigger the group reversal.
 */
export function scatter(t: number): boolean {
  for (let i = 0; i < PHASES.length; i++) {
    if (t < PHASES[i]) return i % 2 === 0;
    t -= PHASES[i];
  }
  return false;
}

/**
 * Is this tile part of the ghost house?
 *
 * Used by: {@link step} (blocks entry unless `houseOk`), {@link moveGhost}
 * (sets `out` once a ghost leaves).
 */
const house = (t: Tile) => MAZE[t.row][t.col] === CELL.GHOST_HOUSE;

/**
 * Take one step from (row, col) by (dRow, dCol); return the tile landed on, or
 * `null` if something blocks it.
 *
 * Why: the single primitive for "is this move legal, and where does it land?" —
 * every mover (Pac-Man via `advance`, ghosts via `moveGhost`, BFS via
 * `towards`) goes through it, so wall rules, the house rule, and tunnel
 * wrap-around are defined once.
 * Used by: `advance`, `moveGhost`, `towards`, and re-exported.
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
 * Resolve Pac-Man's next tile and facing from what the player wants and where
 * he's already going.
 *
 * Why: arcade Pac-Man doesn't stop-and-turn — he keeps going until the wanted
 * turn opens up, then takes it instantly, and if nothing's open he stops but
 * keeps facing the way he was headed. This encodes that feel.
 * How: `on` is where carrying straight on lands (`null` if that's a wall).
 * `want` is only taken if it's a real direction, {@link step} finds the tile
 * that way open, and it isn't a straight reversal — so he changes direction
 * only where the maze actually offers a turn, and never doubles back
 * mid-corridor. Anything else carries on along `dir`, staying put if `on` is
 * `null`. A `want` of `[0, 0]` means "nothing asked for" (no key yet, or the
 * press aged out — see {@link TURN_BUFFER}) and falls through to the same
 * carry-on.
 * Used by: {@link tick}, once per tick, for Pac-Man.
 * Design: refusing the reversal is stricter than the arcade, where a 180° is
 * always legal. The one exception is when `on` is `null` — nose against a wall
 * and going nowhere — because a player who has just run into a wall and asks
 * to go back is owed an answer; anywhere else he's moving, so "only at a turn"
 * still holds.
 */
export function advance(pos: Tile, want: MovementDelta, dir: MovementDelta): { pos: Tile; dir: MovementDelta } {
  const on = step(pos.row, pos.col, ...dir);
  const back = want[0] === -dir[0] && want[1] === -dir[1];
  const turned = (want[0] || want[1]) && (!back || !on) ? step(pos.row, pos.col, ...want) : null;
  if (turned) return { pos: turned, dir: want };
  return { pos: on ?? pos, dir };
}

/**
 * A ghost's mutable per-tick state.
 *
 * Why: each ghost carries more than a position — whether it's escaped the
 * house, a short memory of where it's been, and which behaviour/sprite mode
 * it's in.
 * How & what: `pos`/`dir` are the obvious ones. `out` flips true the first time
 * the ghost stands on a non-house tile and never goes back (so it can't
 * re-enter). `trail` is the last few tile keys, used by {@link moveGhost} to
 * break out of 2-wide-corridor loops. `mode` is `normal` (chase/scatter),
 * `scared` (frightened, edible), or `eyes` (eaten, pathing home to regenerate).
 * `acc` is banked movement in tiles (0..1): each tick adds this ghost's
 * {@link SPEED} rate and the ghost steps a tile once it reaches 1.
 * Used by: {@link moveGhost}, `goHome`, `caught`, {@link tick}, and `Map.tsx`'s
 * ghost render loop.
 */
export type Ghost = { pos: Tile; dir: MovementDelta; out: boolean; trail: string[]; mode: "normal" | "scared" | "eyes"; acc: number };

/**
 * The entire game state — everything one {@link tick} reads and rewrites.
 *
 * Why: keeping *all* mutable state in one plain object is what makes the sim
 * pure and the React side a one-liner (`setGame(g => tick(g, want))`); nothing
 * lives outside it.
 * How: grouped roughly as Pac-Man (`pos`, `dir`), progress (`eaten`, `score`,
 * `lives`, `bonus`), the fruit (`fruit`, `fruits`), ghost release (`idle`,
 * `freed`, `since`), the ghosts themselves, the two clocks (`t` real, `clock`
 * mode — see {@link scatter}), frightened state (`fright`, `combo`), and the
 * brief post-bite freeze (`bite`). Each field is documented inline below.
 * What: a `type` describing a JSON-ish object (the only non-plain value is
 * `eaten`, a `Set`).
 * Used by: {@link tick} (produces the next one), {@link NEW_GAME} (the seed),
 * every predicate here, and `Map.tsx` (renders from it, derives sounds from
 * field deltas).
 * Design: immutable by convention — {@link tick} spreads a fresh object rather
 * than mutating — so React state updates are safe and a tick is easy to reason
 * about or replay.
 */
export type Game = {
  pos: Tile;
  dir: MovementDelta;
  /** Pac-Man's banked movement in tiles: he steps when it reaches 1. Goes negative after a dot (the arcade's per-dot stop). */
  acc: number;
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

/**
 * The pristine starting state for a fresh game.
 *
 * Why: `useState(NEW_GAME)` seeds the React state, and the death branch of
 * {@link tick} reuses `NEW_GAME.ghosts` to reset every ghost to its house tile.
 * How: Pac-Man at {@link PACMAN_SPAWN}, not moving; empty `eaten`; all clocks
 * and counters zero; `lives` = {@link LIVES}; ghosts mapped from {@link GHOSTS}
 * to `{ pos: tile, dir: [0,0], out: false, trail: [], mode: "normal", acc: 0 }`.
 * What: a fully-populated {@link Game}.
 * Design: a single frozen-in-spirit constant (never mutated — {@link tick}
 * copies out of it) so "new game" and "post-death reset" can't drift apart.
 */
export const NEW_GAME: Game = {
  pos: PACMAN_SPAWN,
  dir: [0, 0],
  acc: 0,
  eaten: new Set(),
  fruit: 0,
  fruits: 0,
  idle: 0,
  freed: 0,
  ghosts: GHOSTS.map((g) => ({ pos: g.tile, dir: [0, 0], out: false, trail: [], mode: "normal", acc: 0 })),
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

/**
 * Is a fruit currently on the board?
 *
 * Used by: `Map.tsx` (draw the cherry) and {@link tick}.
 */
export const fruitOut = (g: Game) => g.fruit > 0;

/**
 * Every dot tile key -> its point value.
 *
 * Why: {@link tick} has to answer "did Pac-Man just land on an uneaten dot, and
 * if so how much?" in O(1); a pre-built map does that and doubles as the
 * total-dots count for {@link cleared}.
 * How: merge {@link DOTS}`.pellets` (each -> `POINTS.pellet`) and `.power`
 * (each -> `POINTS.power`) into one `Map`, keyed by {@link key}.
 * What: module-private `Map<string, number>`.
 * Used by: {@link tick} (lookup) and {@link cleared} (`.size`).
 */
const DOT_KEYS = new Map([
  ...DOTS.pellets.map((t) => [key(t), POINTS.pellet] as const),
  ...DOTS.power.map((t) => [key(t), POINTS.power] as const),
]);

/**
 * Has every dot been eaten (level complete)?
 *
 * Why: the win condition. There's one level, so an empty board is the end.
 * How: compare `g.eaten.size` to the total dot count (`DOT_KEYS.size`).
 * What: a pure `(Game) => boolean`.
 * Used by: {@link tick} (stops the sim, and skips the ghost move on the final
 * dot) and `Map.tsx` (GAME COMPLETED screen, and cutting the audio).
 */
export const cleared = (g: Game) => g.eaten.size === DOT_KEYS.size;

/**
 * The four unit directions in the arcade's tie-break order: up, left, down,
 * right.
 *
 * Why: when two moves are equally close to a ghost's target, the original game
 * resolves the tie by a fixed priority; iterating in this order reproduces it.
 * How: {@link moveGhost} and `towards` loop over this array; ties keep the
 * earlier entry.
 * What: module-private `Dir[]`.
 */
const MVMT_DELTAS: MovementDelta[] = [[-1, 0], [0, -1], [1, 0], [0, 1]];

/**
 * Squared Euclidean distance between two tiles.
 *
 * Why: ghosts pick the neighbour "closest in a straight line" to their target;
 * comparing squared distance avoids a `sqrt` and is monotonic so the ordering
 * is identical.
 * Used by: {@link moveGhost} (neighbour choice) and `TARGET[3]` (Clyde's
 * proximity check).
 */
const dist2 = (a: Tile, b: Tile) => (a.row - b.row) ** 2 + (a.col - b.col) ** 2;

/**
 * The tile `n` steps ahead of Pac-Man along his current facing (no wall
 * checks).
 *
 * Why: Pinky and Inky aim at a point *in front of* Pac-Man, not at him; this
 * projects that point.
 * How: `pos + dir * n`, straight arithmetic — it may land in a wall or off the
 * grid, which is fine, it's only a target coordinate.
 * What: a module-private `(Game, number) => Tile`.
 * Used by: `TARGET[1]` (Pinky, n=4) and `TARGET[2]` (Inky, n=2).
 */
const ahead = (g: Game, n: number): Tile => ({ row: g.pos.row + g.dir[0] * n, col: g.pos.col + g.dir[1] * n });

/**
 * Chase-mode target functions, one per ghost, indexed like {@link GHOSTS}.
 *
 * Why: the four ghosts' personalities *are* their chase targets — this table is
 * that personality set, isolated from the movement code that consumes it.
 * How, per index:
 *  - 0 Blinky: Pac-Man's tile (straight pursuit).
 *  - 1 Pinky: 4 tiles ahead of Pac-Man (ambush).
 *  - 2 Inky: reflect Blinky's position through the point 2 tiles ahead of
 *    Pac-Man (`2*ahead - blinky`) — needs both actors, so it's erratic.
 *  - 3 Clyde: Pac-Man's tile while far (dist² > 64, i.e. >8 tiles), but his own
 *    scatter corner once close — so he peels off when he gets near.
 * What: module-private `((Game) => Tile)[]`.
 * Used by: {@link tick}, which calls `TARGET[i](next)` for an `out`, unscared,
 * chasing ghost.
 * Design: the ponytail note — the real arcade's Pinky/Inky have an 8-bit
 * overflow bug when Pac-Man faces up; this deliberately uses the "corrected"
 * vector because reproducing a CPU quirk isn't worth the code.
 */
const TARGET: ((g: Game) => Tile)[] = [
  (g) => g.pos,
  (g) => ahead(g, 4),
  (g) => {
    const a = ahead(g, 2), b = g.ghosts[0].pos;
    return { row: 2 * a.row - b.row, col: 2 * a.col - b.col };
  },
  (g) => (dist2(g.pos, g.ghosts[3].pos) > 64 ? g.pos : GHOSTS[3].corner),
];

/**
 * How many recent tiles each ghost remembers in `Ghost.trail`.
 *
 * Why: greedy "closest neighbour" steering can lock a ghost into a tight loop
 * on this map's open blocks; a short tabu list of visited tiles breaks it.
 * How: {@link moveGhost} prefers a neighbour not in `trail`, and pushes the
 * tile it leaves onto the front, capped at this length.
 * What: module-private `number` (4).
 * Design: 4 is the perimeter of the smallest loop here (a 2x2 block), so it's
 * just enough memory to escape one without over-constraining normal movement.
 */
const TRAIL = 4;

/**
 * Advance one ghost by a tile toward `target` under arcade rules.
 *
 * Why: all ghost movement — chasing, scattering, heading for the door,
 * fleeing while frightened — is the same "pick a neighbour" step with a
 * different target; this is that step.
 * How: build the list of `open` neighbours, excluding a straight reversal
 * (ghosts never turn back mid-corridor) and anything {@link step} rejects
 * (`!g.out` passes `houseOk` so a caged ghost can move inside). If boxed in,
 * turn around and move next tick. Otherwise start from a random open pick and,
 * if there's a `target`, replace it with any neighbour that is "fresher" (not
 * in `trail`) or — same freshness — strictly closer by {@link dist2}, scanning
 * in {@link MVMT_DELTAS} order so ties resolve up>left>down>right. `target: null` is
 * frightened mode: keep the random pick. A mode change / power pellet reverses
 * `dir` before this is called (see {@link tick}), so the reversal is simply
 * "the way we now face". Finally push the vacated tile onto `trail` and set
 * `out` once clear of the house.
 * What: a pure `(Ghost, Tile | null) => Ghost`.
 * Used by: {@link tick}, for every `out`/releasable ghost that isn't in `eyes`
 * mode, on the tick its banked `acc` reaches a whole tile.
 * Design: the `trail` "freshness" tie-break is the one non-arcade addition —
 * pure greedy steering visibly loops on this custom map. Random-then-refine
 * keeps frightened movement genuinely unpredictable while chase stays
 * deterministic.
 */
export function moveGhost(g: Ghost, target: Tile | null): Ghost {
  const { dir } = g;
  const open = MVMT_DELTAS.flatMap((d) => {
    if (d[0] === -dir[0] && d[1] === -dir[1]) return [];
    const pos = step(g.pos.row, g.pos.col, d[0], d[1], !g.out);
    return pos ? [{ pos, dir: d, fresh: !g.trail.includes(key(pos)) }] : [];
  });
  if (!open.length) return { ...g, dir: [-dir[0], -dir[1]] }; // boxed in: turn around, move next step
  let best = open[Math.floor(Math.random() * open.length)];
  if (target)
    for (const c of open) {
      const better = (c.fresh && !best.fresh) || (c.fresh === best.fresh && dist2(c.pos, target) < dist2(best.pos, target));
      if (c === open[0] || better) best = c;
    }
  const trail = [key(g.pos), ...g.trail].slice(0, TRAIL);
  return { ...g, pos: best.pos, dir: best.dir, out: g.out || !house(best.pos), trail };
}

/**
 * First tile on a shortest path from `from` to `to` (breadth-first, house
 * allowed).
 *
 * Why: an eaten ghost ("eyes") has to get *back into* the side-opening house
 * reliably; greedy steering loops forever on that geometry, so eyes need real
 * pathfinding.
 * How: BFS over {@link MVMT_DELTAS} with `step(..., true)` so house tiles are
 * traversable, recording each tile's predecessor in `prev`. On reaching `to`,
 * walk predecessors back until the step *before* `from`, and return that — the
 * single next tile to move to.
 * What: a module-private `(Tile, Tile) => Tile | null` (`null` if unreachable,
 * which shouldn't happen on a connected board).
 * Used by: `goHome` only.
 * Design: BFS (not A*) because the board is tiny — cost/benefit says the
 * simplest correct search wins; returning just the next hop keeps `goHome` a
 * plain move loop.
 */
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
    for (const d of MVMT_DELTAS) {
      const n = step(t.row, t.col, d[0], d[1], true);
      if (n && !prev.has(key(n))) { prev.set(key(n), t); queue.push(n); }
    }
  }
  return null;
}

/**
 * Move an "eyes" ghost one tile toward its home tile; regenerate it on arrival.
 *
 * Why: an eaten ghost races home (at `SPEED.eyes`) and comes back as a normal
 * ghost — that's the reward loop for clearing a frightened chain.
 * How: one hop via {@link towards}; the direction is `sign` of the delta so
 * the sprite faces its travel. Landing on `GHOSTS[i].tile` returns it to
 * `mode: "normal"`, `out: false`, `trail: []`, so {@link moveGhost} then walks
 * it back out the door.
 * What: a module-private `(Ghost, number) => Ghost`.
 * Used by: {@link tick}, for any ghost in `eyes` mode, on the tick its banked
 * `acc` reaches a whole tile.
 * Design: resetting `out`/`trail` on regen means the normal house-exit logic
 * takes over with no special case.
 */
function goHome(gh: Ghost, i: number): Ghost {
  const home = GHOSTS[i].tile;
  const pos = towards(gh.pos, home) ?? gh.pos;
  const dir: MovementDelta = [Math.sign(pos.row - gh.pos.row), Math.sign(pos.col - gh.pos.col)];
  return key(pos) === key(home) ? { ...gh, pos, dir, mode: "normal", out: false, trail: [] } : { ...gh, pos, dir };
}

/**
 * Did ghost `i` and Pac-Man come into contact on this tick?
 *
 * Why: same-tile is the obvious contact, but on a grid two things moving toward
 * each other can *swap* tiles in one tick without ever sharing one; the arcade
 * counts that as contact and so must this, or ghosts phase through Pac-Man.
 * How: true if the ghost ends on Pac-Man's new tile, or if it ended on Pac-Man's
 * *old* tile while Pac-Man ended on its *old* tile (a head-on swap).
 * What: a module-private `(before: Game, after: Game, i: number) => boolean`.
 * Used by: {@link tick}, after the ghosts move — a `scared` contact is a bite,
 * a `normal` one a death.
 * Design: takes both the pre- and post-move states because the swap test needs
 * both endpoints.
 */
function met(before: Game, after: Game, i: number): boolean {
  const gh = after.ghosts[i];
  if (key(gh.pos) === key(after.pos)) return true;
  const was = before.ghosts[i].pos;
  return key(gh.pos) === key(before.pos) && key(was) === key(after.pos);
}

/**
 * Advance the whole game by one frame. The core of the sim.
 *
 * Why: the render loop needs exactly one pure function to call each frame;
 * everything the game *does* in a 60th of a second happens here, so state
 * stays consistent and a step is replayable.
 * How, in order:
 *  1. Bail if the game is over/won (return `g` unchanged), or if a post-bite
 *     freeze is running (just count `bite.left` down — the fright clock freezes
 *     too).
 *  2. Bank Pac-Man's speed for this frame into `acc`; once a whole tile is
 *     banked, move him with {@link advance} and see what tile he's on. Stopped
 *     at a wall, `acc` stays primed at 1 so a new key moves him at once.
 *  3. Eat: an uneaten dot adds its {@link POINTS} and a key to `eaten` — and
 *     takes `SPEED.stall` frames back out of `acc` (the arcade's per-dot stop);
 *     the cherry (fruit out and on {@link FRUIT_SPAWN}) adds `POINTS.cherry` and
 *     clears the fruit. Count the fruit timer down; spawn the next fruit when
 *     `eaten.size` crosses the next {@link FRUIT_AT} threshold and none is out.
 *  4. Score/lives: add the extra life the first tick `score >= EXTRA_LIFE_AT`.
 *  5. Clocks: `t` always ticks; `fright` is reset by a power pellet else
 *     decremented; the mode `clock` only ticks when not frightened.
 *  6. Idle release: `idle` counts dot-less ticks; at {@link RELEASE_IDLE} it
 *     frees the next still-caged ghost.
 *  7. If that ate the last dot, return now — ghosts get no move on the winning
 *     tile.
 *  8. Move ghosts. Each banks its own {@link SPEED} rate — `eyes`, tunnel,
 *     frightened, Blinky's Elroy boost, or plain — and steps only when a whole
 *     tile is banked. `eyes` -> {@link goHome}; otherwise set `scared` from
 *     power/fright, skip a still-caged ghost, reverse `dir` on a scatter/chase
 *     flip or a power pellet, pick a target (door if not out, `null` if scared,
 *     corner if scattering, else `TARGET[i]`), and call {@link moveGhost}.
 *  9. Resolve contact ({@link met}): a `scared` ghost is a bite —
 *     `POINTS.ghost << combo` points, that ghost -> `eyes`, and a one-second
 *     `bite` freeze. A `normal`, `out` ghost is a death: decrement `lives`,
 *     record `since`, put everyone back on their start tiles, and zero the
 *     clocks/timers (dots and score persist).
 * What: a pure `(Game, want: Dir) => Game`, where `want` is the direction the
 * player is asking for on this tick and `[0, 0]` is "nothing asked for" — how
 * long a press keeps asking is the view layer's business (see
 * {@link TURN_BUFFER}).
 * Used by: `Map.tsx`'s frame loop (`setGame(g => tick(g, want.current))`, once per {@link TICK_MS} elapsed).
 * Design: one big function, top-to-bottom, spreading a fresh object at each
 * stage rather than mutating — the ordering (eat, then move ghosts, then check
 * collisions) is what makes the rules line up with the arcade, and purity is
 * what lets React and the sound layer treat a tick as a value.
 */
export function tick(g: Game, want: MovementDelta): Game {
  if (!g.lives || cleared(g)) return g; // game over or completed
  if (g.bite) return { ...g, bite: g.bite.left > 1 ? { ...g.bite, left: g.bite.left - 1 } : null }; // everything freezes, fright clock included
  const pace = pacmanRate(g.fright ? SPEED.pacmanFright : SPEED.pacman);
  let acc = g.acc + pace, pos = g.pos, dir = g.dir;
  if (acc >= 1) {
    ({ pos, dir } = advance(g.pos, want, g.dir));
    acc = key(pos) === key(g.pos) ? 1 : acc - 1; // blocked: stay primed so a new key moves him at once
  }
  const k = key(pos);
  const dot = g.eaten.has(k) ? 0 : (DOT_KEYS.get(k) ?? 0);
  const eaten = dot ? new Set(g.eaten).add(k) : g.eaten;
  if (dot) acc -= (SPEED.stall[dot] ?? 0) * pace; // the arcade stops Pac-Man for a frame per dot, three per power pellet
  const cherry = fruitOut(g) && k === key(FRUIT_SPAWN);
  // The fruit counts down while out; the next one appears once its dot trigger is reached and no fruit is out.
  let fruit = cherry ? 0 : Math.max(0, g.fruit - 1), fruits = g.fruits;
  if (!fruit && eaten.size >= (FRUIT_AT[fruits] ?? Infinity)) { fruit = FRUIT_TICKS; fruits++; }
  const score = g.score + dot + (cherry ? POINTS.cherry : 0);
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
  const next = { ...g, pos, dir, acc, eaten, fruit, fruits, score, bonus, lives, t, clock, fright, idle, freed, combo: power ? 0 : g.combo };
  if (cleared(next)) return next; // last dot: the ghosts don't get a move on it
  // A power pellet, like a mode switch, turns every ghost around.
  const flip = scatter(clock) !== scatter(g.clock) || power;
  // Blinky's Elroy boost: on once few enough dots remain, but off after a death until Clyde is back out.
  const left = DOT_KEYS.size - eaten.size;
  const elroy = g.ghosts[3].out ? SPEED.elroy.find(([dots]) => left <= dots)?.[1] : undefined;
  const ghosts = g.ghosts.map((gh, i) => {
    if (gh.mode === "eyes") {
      const acc = gh.acc + rate(SPEED.eyes);
      return acc < 1 ? { ...gh, acc } : goHome({ ...gh, acc: acc - 1 }, i);
    }
    const scared = power || (gh.mode === "scared" && fright > 0);
    gh = { ...gh, mode: scared ? "scared" : "normal" };
    if (!gh.out && !released(next, i)) return gh;
    if (flip) gh = { ...gh, dir: [-gh.dir[0], -gh.dir[1]] };
    const acc = gh.acc + rate(tunnel(gh.pos) ? SPEED.tunnel : scared ? SPEED.fright : (i === 0 && elroy) || SPEED.ghost);
    if (acc < 1) return { ...gh, acc };
    const target = !gh.out ? GHOSTS[i].door : scared ? null : scatter(clock) ? GHOSTS[i].corner : TARGET[i](next);
    return moveGhost({ ...gh, acc: acc - 1 }, target);
  });
  const after = { ...next, ghosts };
  const bit = ghosts.findIndex((gh, i) => gh.mode === "scared" && met(g, after, i));
  if (bit >= 0) {
    const points = POINTS.ghost << g.combo;
    const eyes = ghosts.map((gh, i) => (i === bit ? { ...gh, mode: "eyes" as const } : gh));
    return { ...after, ghosts: eyes, score: score + points, combo: g.combo + 1, bite: { pos, points, left: SEC } };
  }
  if (!ghosts.some((gh, i) => gh.out && gh.mode === "normal" && met(g, after, i))) return after;
  // Death: everyone back to their start tiles, mode clock and fright reset; dots and score stay.
  return { ...after, lives: lives - 1, since: eaten.size, pos: PACMAN_SPAWN, dir: [0, 0], acc: 0, ghosts: NEW_GAME.ghosts, t: 0, clock: 0, fright: 0, idle: 0, freed: 0 };
}
