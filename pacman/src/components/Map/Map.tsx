"use client";

/**
 * Map.tsx — the entire visible game: the React component that runs the tick
 * loop, draws the maze, places every sprite, and plays the sounds.
 *
 * Why: `level.ts` is a pure, headless simulation; something has to give it a
 * clock, feed it the keyboard, and paint each resulting {@link Game} to the
 * DOM. That's this file, and it's a client component (`"use client"`) because
 * all of that — `window`, `setInterval`, `Audio`, `<canvas>` — is browser-only.
 * How: three hooks and two render helpers.
 *   - {@link useGame} owns the animation-frame loop that calls `tick` once per
 *     {@link TICK_MS} of real time and the `keydown` listener that sets the
 *     wanted direction.
 *   - {@link useSounds} diffs successive states and starts/stops audio off the
 *     changes.
 *   - `drawMaze`/`drawWall` render the walls once to a `<canvas>`.
 *   - The component body places dots, fruit, ghosts and Pac-Man as absolutely
 *     positioned `.sprite` divs over that canvas, sized by a single
 *     `--maze-cell` CSS variable.
 * What: the default-exported `Map` component plus its private helpers.
 * Used by: `src/app/page.tsx`, via `@/components/Map`.
 * Design: canvas for the static maze (one draw, crisp curves), DOM divs for the
 * handful of moving sprites (cheap, styleable, animatable via CSS keyframes in
 * `globals.css`). The sim stays the source of truth; this file only ever reads
 * it.
 */

import { useEffect, useRef, useState } from "react";
import {
  CELL,
  DOTS,
  FRIGHT,
  FRUIT_SPAWN,
  GHOSTS,
  MAZE,
  MAZE_COLS,
  MAZE_ROWS,
  NEW_GAME,
  TICK_MS,
  cleared,
  fruitOut,
  isWall,
  key,
  released,
  tick,
  type MovementDelta,
  type Game,
  type Tile,
} from "./level";

/**
 * The "not moving" direction, reused so identity comparisons work.
 *
 * Why: {@link useGame} checks `want.current === STOP` to detect the very first
 * key press (which triggers the opening jingle); that needs one shared
 * reference, not a fresh `[0, 0]` each time.
 * What: a frozen-by-convention {@link MovementDelta}.
 */
const STOP: MovementDelta = [0, 0];

/**
 * Sprite timing, in ticks (= frames at 60 Hz).
 *
 * What: `GHOST_FRAME` = ticks per ghost leg-animation frame (8, as the arcade);
 * `FLASH` = ticks per colour while a frightened ghost flashes white (12 gives
 * the arcade's ~5 flashes in the 2-second warning); `CHOMP_HOLD` = ticks the
 * chomp loop keeps playing after a dot (a dot lands every ~9 ticks while
 * eating, so 12 bridges the gap without trailing on).
 * Used by: the ghost render loop and {@link useSounds}.
 */
const GHOST_FRAME = 8;
const FLASH = 12;
const CHOMP_HOLD = 12;

/**
 * Most real time (ms) the tick loop will make up in one animation frame.
 *
 * Why: a background tab gets no frames; on return the loop would otherwise run
 * seconds of ticks at once and Pac-Man would die off-screen. Capping at a few
 * ticks' worth means a long gap just pauses the game instead.
 */
const MAX_CATCH_UP_MS = 4 * TICK_MS;

/**
 * Keyboard-key -> direction map, arrows and WASD both.
 *
 * Why: turns a raw `KeyboardEvent` into the {@link MovementDelta} the sim understands, and
 * doubles as the "is this a movement key?" test (a missing entry -> ignore).
 * How: keyed by `e.key.toLowerCase()`; up/left/down/right map to the same
 * `[dRow, dCol]` unit vectors used everywhere else.
 * What: a `Record<string, Dir>`.
 * Used by: the `keydown` handler in {@link useGame}.
 * Design: both control schemes point at the *same* tuple objects — cheap, and
 * fine because directions are treated as immutable.
 */
const KEYS: Record<string, MovementDelta> = {
  arrowup: [-1, 0], w: [-1, 0],
  arrowdown: [1, 0], s: [1, 0],
  arrowleft: [0, -1], a: [0, -1],
  arrowright: [0, 1], d: [0, 1],
};

/**
 * Registry of every `Audio` element ever started via {@link sound}.
 *
 * Why: sounds are created ad hoc all over {@link useSounds}; ending the game
 * has to silence *all* of them at once, so they need to be tracked in one
 * place.
 * How: {@link sound} adds each new element; one-shots remove themselves on
 * `ended`; {@link stopAll} pauses and clears the lot.
 * What: a module-level `Set<HTMLAudioElement>`.
 * Design: module scope (not component state) because audio outlives renders and
 * there's only ever one board; a `Set` so add/delete are O(1) and dedup is free.
 */
const playing = new Set<HTMLAudioElement>();

/**
 * Create an `Audio` for `/sounds/<name>` and enrol it in {@link playing}.
 *
 * Why: every sound in the game must be track-able by {@link stopAll}; going
 * through one factory guarantees that.
 * How: `new Audio(...)`, add to `playing`, and wire an `ended` listener that
 * drops one-shots back out once they finish (loops never fire `ended`, so they
 * stay until {@link stopAll}).
 * What: `(name: string) => HTMLAudioElement` — returns the element without
 * playing it, so the caller can set `.loop` or `.onended` first.
 * Used by: {@link play} and the loop setup in {@link useSounds} / {@link useGame}.
 */
const sound = (name: string) => {
  const a = new Audio(`/sounds/${name}`);
  playing.add(a);
  a.addEventListener("ended", () => playing.delete(a)); // one-shots drop out once they finish
  return a;
};

/**
 * Fire-and-forget a one-shot sound effect.
 *
 * Why: most game sounds (die, eat-ghost, eat-fruit…) are just "play once now".
 * How: {@link sound} + `.play()`, with the rejection swallowed — browsers reject
 * `play()` until the user has interacted with the page, and a missed effect
 * isn't worth an unhandled promise.
 * What: `(name: string) => void`.
 * Used by: {@link useSounds} for every event cue.
 */
const play = (name: string) => sound(name).play().catch(() => {});

/**
 * Stop and rewind every sound the game currently has going.
 *
 * Why: on win or loss the board is replaced by a text screen; any playing
 * effect or loop (siren, chomp) has to be cut immediately and nothing new
 * started.
 * How: iterate {@link playing}, `pause()` + reset `currentTime`, then `clear()`
 * the set.
 * What: `() => void`.
 * Used by: {@link useSounds}, the moment `!game.lives || cleared(game)`.
 */
const stopAll = () => {
  playing.forEach((a) => { a.pause(); a.currentTime = 0; });
  playing.clear();
};

/**
 * Hook: owns the game state and the two inputs that drive it — the tick clock
 * and the keyboard.
 *
 * Why: keep all the imperative, effectful machinery (interval, listener,
 * refs) in one place so the component body can be pure "state -> JSX".
 * How: `useState(NEW_GAME)` holds the current {@link Game}. `want` (a ref) is
 * the latest requested direction; `go` (a ref) gates the loop so ticking only
 * begins after the opening jingle. In a mount-once `useEffect`: a `keydown`
 * handler maps the key via {@link KEYS}, and on the *first* key (`want.current
 * === STOP`) starts `opening_song.mp3`, flipping `go` true when it ends (or
 * immediately if audio is blocked); a `requestAnimationFrame` loop banks the
 * real time elapsed since the last frame (only once `go` is true, capped at
 * {@link MAX_CATCH_UP_MS}) and runs one `tick(g, want.current)` per
 * {@link TICK_MS} owed, in a single `setGame`. Cleanup removes both.
 * What: `() => Game`.
 * Used by: the {@link Map} component.
 * Design: refs (not state) for `want`/`go` because changing them must *not*
 * re-render — only the tick's `setGame` should. The loop reads `want.current`
 * live, so the newest direction always wins. A fixed-step accumulator rather
 * than `setInterval` because browsers round timer delays to whole milliseconds
 * (16.67 -> 16, i.e. 4% fast) and throttle them in hidden tabs; frames track
 * the display clock exactly and simply stop while the tab is hidden. The empty
 * dep array means one loop for the component's life.
 */
function useGame() {
  const [game, setGame] = useState(NEW_GAME);
  const want = useRef(STOP);
  const go = useRef(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const d = KEYS[e.key.toLowerCase()];
      if (!d) return;
      if (want.current === STOP) {
        const jingle = sound("opening_song.mp3");
        jingle.onended = () => (go.current = true);
        jingle.play().catch(() => (go.current = true)); // audio blocked: just start
      }
      want.current = d;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    // Fixed-step loop: bank real elapsed time and run one tick per TICK_MS of it. Browsers truncate
    // timers to whole ms (a 16.67ms interval fires every 16ms), so an interval would run 4% fast.
    let raf = 0, last = performance.now(), owed = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (go.current) owed = Math.min(owed + now - last, MAX_CATCH_UP_MS); // a hidden tab shouldn't fast-forward on return
      last = now;
      const n = Math.floor(owed / TICK_MS);
      owed -= n * TICK_MS;
      if (n) setGame((g) => { for (let i = 0; i < n; i++) g = tick(g, want.current); return g; });
    };
    raf = requestAnimationFrame(frame);
    return () => {
      window.removeEventListener("keydown", onKey);
      cancelAnimationFrame(raf);
    };
  }, []);

  return game;
}

/**
 * Hook: derives all audio from the frame-to-frame change in game state.
 *
 * Why: sound is a pure function of "what just happened", and what just happened
 * is `game` vs. the previous `game`. Doing it here keeps {@link useGame} and the
 * render free of audio concerns.
 * How: a `prev` ref holds last render's state. Each time `game` changes: if the
 * game just ended (no lives or cleared) call {@link stopAll} and bail. Otherwise
 * compare fields and react — `lives` down -> `die`, up -> `extra-lives`; a new
 * `bite` -> `eatghost`; `fright` risen -> `eatpill`; fruit gone while on its
 * tile -> `eatfruit`. Two continuous sounds are handled by the local `loop`
 * helper, which lazily creates a looping element per name and pauses/resumes it:
 * the chomp loop runs while a dot was eaten within the last {@link CHOMP_HOLD}
 * ticks (ticks are frames, so "this tick" would flicker between tiles); the
 * siren runs whenever the game is live and not mid-bite. A second, unmounting
 * effect pauses every loop on teardown.
 * What: `(game: Game) => void`.
 * Used by: the {@link Map} component, once per render.
 * Design: event sounds keyed off deltas (not off React events) so they stay in
 * lock-step with the sim even though ticks come from an interval. The ponytail
 * note: there's deliberately no separate frightened-mode siren — one siren
 * keeps the audio code short.
 */
function useSounds(game: Game) {
  const prev = useRef(game);
  const ate = useRef(-Infinity); // tick of the last dot eaten
  const loops = useRef<Record<string, HTMLAudioElement>>({});
  useEffect(() => {
    const p = prev.current;
    prev.current = game;
    if (!game.lives || cleared(game)) { stopAll(); return; } // the game just ended, win or lose: cut everything, start nothing new
    const loop = (name: string, on: boolean) => {
      const a = (loops.current[name] ??= Object.assign(sound(name), { loop: true }));
      if (!on) a.pause();
      else if (a.paused) a.play().catch(() => {});
    };
    if (game.lives < p.lives) play("die.mp3");
    if (game.lives > p.lives) play("extra-lives.mp3");
    if (game.bite && !p.bite) play("eatghost.mp3");
    if (game.fright > p.fright) play("eatpill.mp3");
    if (p.fruit && !game.fruit && key(game.pos) === key(FRUIT_SPAWN)) play("eatfruit.wav");
    if (game.t < p.t) ate.current = -Infinity; // a death reset the clock
    if (game.eaten.size > p.eaten.size) ate.current = game.t;
    loop("eating.mp3", game.t - ate.current < CHOMP_HOLD);
    loop("siren.mp3", game.t > 0 && game.lives > 0 && !cleared(game) && !game.bite); // ponytail: no separate frightened siren
  }, [game]);
  useEffect(() => () => Object.values(loops.current).forEach((a) => a.pause()), []);
}

/**
 * Inline `top`/`left` style putting a `.sprite` on tile `t`.
 *
 * Why: sprites are absolutely positioned over the canvas; their pixel offset is
 * always "tile index × cell size", and cell size is the responsive
 * `--maze-cell` CSS variable, so the maths has to happen in CSS `calc`, not JS.
 * What: `(t: Tile) => { top: string; left: string }`.
 * Used by: {@link sprite}, and directly for the ghost bob div, the bite-points
 * span, and Pac-Man.
 * Design: returning a style object (not a class) because the position is
 * per-tile and continuous; `calc(n * var(--maze-cell))` means one variable
 * resizes the whole board.
 */
const at = (t: Tile) => ({
  top: `calc(${t.row} * var(--maze-cell))`,
  left: `calc(${t.col} * var(--maze-cell))`,
});

/**
 * `Dir` (stringified) -> sprite-direction word.
 *
 * Why: ghost sprite filenames are `name-<face>-<frame>.svg`; a ghost's `dir`
 * tuple has to become `"up"|"down"|"left"|"right"`.
 * How: `String([dRow, dCol])` yields e.g. `"-1,0"`, used as the key.
 * What: `Record<string, string>`.
 * Used by: the ghost render loop (`FACE[String(gh.dir)] ?? "up"` — `??` covers
 * a just-spawned ghost whose `dir` is still `[0,0]`).
 */
const FACE: Record<string, string> = { "-1,0": "up", "1,0": "down", "0,-1": "left", "0,1": "right" };

/**
 * Build one positioned sprite div.
 *
 * Why: dots, power pellets, the cherry and moving ghosts are all "a `.sprite`
 * at a tile with a background image"; this is the shared factory.
 * How: a `<div>` with the {@link at} position merged into `style`, the image as
 * an inline `backgroundImage`, a caller-supplied `className` (extra classes tune
 * the background size in `globals.css`), and a React `key` defaulting to the
 * tile key.
 * What: `(t, src, className?, k?) => JSX.Element`.
 * Used by: the {@link Map} body for pellets, power pellets, the cherry, and
 * released ghosts.
 * Design: image via inline style rather than an `<img>` so the same element can
 * be restyled by class and animated by CSS; explicit `k` lets ghosts key by
 * name (stable across ticks) instead of by their moving position.
 */
const sprite = (t: Tile, src: string, className = "sprite", k = key(t)) => (
  <div key={k} className={className} style={{ ...at(t), backgroundImage: `url(${src})` }} />
);

/**
 * Canvas geometry for the maze render.
 *
 * Why: the wall art is drawn to a `<canvas>` at a fixed high resolution and
 * then CSS-scaled down to the responsive board size, so curves stay smooth at
 * any zoom.
 * What: `PX` = pixels per tile in the backing store (32); `LINE` = wall stroke
 * width (2px); `WALL_COLOR` = the arcade blue.
 * Used by: `drawWall`, `drawMaze`, and the `<canvas width/height>` (which use
 * `MAZE_COLS/ROWS * PX`).
 * Design: oversize-and-downscale is simpler and sharper than redrawing on
 * resize; the on-screen size is driven entirely by `--maze-cell`.
 */
const PX = 32;
const LINE = 2;
const WALL_COLOR = "#2b7fff";

/**
 * Stroke the four sides + rounded corners of a single wall tile.
 *
 * Why: arcade maze walls are one cell thick and drawn as a hollow double line;
 * you get that look by outlining only the sides of a wall cell that face open
 * space, and rounding a corner wherever two adjacent open sides meet.
 * How: `up/down/left/right` = "is the neighbour on that side *not* a wall"
 * (via {@link isWall}, which treats off-grid as open so the border gets an
 * outline). `tl/tr/bl/br` are the corner flags. For each open side draw a line
 * inset by half {@link LINE} (`lo`/`hi`) so the stroke sits inside the tile,
 * shortened by the radius `r` at any rounded end. Then draw a quarter-circle
 * (radius `r`, centre `cx,cy`) for each corner flag.
 * What: `(ctx, row, col) => void`, side-effecting on the 2D context.
 * Used by: `drawMaze`, for every `CELL.WALL` tile.
 * Design: per-tile edge detection (rather than tracing wall outlines) keeps the
 * algorithm local and order-independent — each tile is fully determined by its
 * four neighbours.
 */
function drawWall(ctx: CanvasRenderingContext2D, row: number, col: number) {
  const up = !isWall(row - 1, col);
  const down = !isWall(row + 1, col);
  const left = !isWall(row, col - 1);
  const right = !isWall(row, col + 1);
  const tl = up && left, tr = up && right, bl = down && left, br = down && right;

  const x = col * PX, y = row * PX, r = PX / 2, cx = x + r, cy = y + r;
  // Inset by half the line width so the stroke stays inside the tile.
  const lo = LINE / 2, hi = PX - LINE / 2;

  ctx.beginPath();
  if (up) { ctx.moveTo(x + (tl ? r : 0), y + lo); ctx.lineTo(x + PX - (tr ? r : 0), y + lo); }
  if (down) { ctx.moveTo(x + (bl ? r : 0), y + hi); ctx.lineTo(x + PX - (br ? r : 0), y + hi); }
  if (left) { ctx.moveTo(x + lo, y + (tl ? r : 0)); ctx.lineTo(x + lo, y + PX - (bl ? r : 0)); }
  if (right) { ctx.moveTo(x + hi, y + (tr ? r : 0)); ctx.lineTo(x + hi, y + PX - (br ? r : 0)); }
  ctx.stroke();

  const arc = (from: number, to: number) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r - LINE / 2, from * Math.PI, to * Math.PI);
    ctx.stroke();
  };
  if (tl) arc(1, 1.5);
  if (tr) arc(1.5, 2);
  if (br) arc(0, 0.5);
  if (bl) arc(0.5, 1);
}

/**
 * Paint the whole maze onto a canvas, once.
 *
 * Why: the walls never change during play, so they're drawn a single time
 * instead of every tick.
 * How: get the 2D context, set the shared stroke style/width, and call
 * {@link drawWall} for every `CELL.WALL` tile in {@link MAZE}.
 * What: `(canvas: HTMLCanvasElement) => void`.
 * Used by: the {@link Map} component, in a mount-once `useEffect`.
 * Design: separated from the component so the render body has no imperative
 * canvas code; the non-null `getContext` assertion is safe because the ref is
 * always attached before the effect runs.
 */
function drawMaze(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!;
  ctx.strokeStyle = WALL_COLOR;
  ctx.lineWidth = LINE;
  MAZE.forEach((line, row) =>
    line.forEach((cell, col) => cell === CELL.WALL && drawWall(ctx, row, col)),
  );
}

/**
 * The game component: wires the hooks together and renders the current
 * {@link Game}.
 *
 * Why: this is what `page.tsx` mounts — the single React node that *is* the
 * playable game.
 * How: {@link useGame} yields the live state; {@link useSounds} handles audio as
 * a side effect; a mount-once effect calls {@link drawMaze}. Then:
 *   - If `!game.lives` or `cleared(game)`, return the end screen — "GAME
 *     COMPLETED" (green) on a clear, "GAME OVER" (pink) on a loss — plus the
 *     final score.
 *   - Otherwise return the board: a wrapper that defines `--maze-cell` (a
 *     `clamp()` so the board scales with viewport but stays within sane bounds),
 *     the `<canvas>` (sized `MAZE_COLS/ROWS * PX`, displayed via `--maze-cell`),
 *     then the remaining pellets and power pellets (filtered by `left`, i.e.
 *     not in `eaten`), the cherry if `fruitOut`, every ghost, a floating
 *     bite-points number during the freeze, the score `<output>`, Pac-Man
 *     (`rotate` from `atan2(dRow, dCol)` since the art faces right at 0°, and
 *     `hidden` during a bite), and the row of life pips (`lives - 1`).
 *   - Each ghost picks its sprite from `mode`/facing/`game.t` (every
 *     {@link GHOST_FRAME} ticks the leg frame flips): `eyes-*` when eaten,
 *     `name-face-frame` when normal, `scared[-white]-frame` when frightened
 *     (white for the last {@link FRIGHT}`.flash` ticks, alternating every
 *     {@link FLASH} ticks). A ghost not yet {@link released} isn't placed by
 *     {@link sprite}; instead a `.bob` div animates it in the house (CSS
 *     variables `--bob/--go/--back` tell the keyframes which way to drift and
 *     which two frames to alternate). The just-eaten ghost is hidden behind its
 *     points during the freeze.
 * What: `() => JSX.Element`, the default export.
 * Used by: `src/components/Map/index.ts` -> `src/app/page.tsx`.
 * Design: derived-not-stored rendering — every frame is a pure function of
 * `game` — so correctness lives in `level.ts` and this stays a view. Canvas for
 * the static maze, DOM sprites for the few movers, CSS keyframes (in
 * `globals.css`) for chomp/bob so no animation logic is in JS.
 */
export default function Map() {
  const game = useGame();
  useSounds(game);
  const { pos, dir } = game;
  const left = (t: Tile) => !game.eaten.has(key(t));
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => drawMaze(canvas.current!), []);

  const done = cleared(game);
  if (!game.lives || done) {
    return (
      <div className="font-arcade text-center">
        <p className={`text-2xl sm:text-4xl ${done ? "text-[#00ff00]" : "text-[#ffb7c5]"}`}>
          {done ? "GAME COMPLETED" : "GAME OVER"}
        </p>
        <p className="mt-8 text-base text-white sm:text-2xl">SCORE {game.score}</p>
      </div>
    );
  }

  return (
    <div style={{ "--maze-cell": "clamp(6px, min(3vw, 3vh), 26px)" } as React.CSSProperties}>
    <div className="relative bg-black">
      <canvas
        ref={canvas}
        width={MAZE_COLS * PX}
        height={MAZE_ROWS * PX}
        role="img"
        aria-label="Pac-Man maze"
        className="block"
        style={{
          width: `calc(${MAZE_COLS} * var(--maze-cell))`,
          height: `calc(${MAZE_ROWS} * var(--maze-cell))`,
        }}
      />
      {DOTS.pellets.filter(left).map((t) => sprite(t, "/pellet.svg", "sprite pellet"))}
      {DOTS.power.filter(left).map((t) => sprite(t, "/power-pellet.svg", "sprite power"))}
      {fruitOut(game) && sprite(FRUIT_SPAWN, "/cherry.svg", "sprite cherry")}
      {game.ghosts.map((gh, i) => {
        const frame = Math.floor(game.t / GHOST_FRAME) & 1;
        const face = FACE[String(gh.dir)] ?? "up";
        const src =
          gh.mode === "eyes" ? `eyes-${face}`
          : gh.mode === "normal" ? `${GHOSTS[i].name}-${face}-${frame}`
          : game.fright <= FRIGHT.flash && Math.floor(game.t / FLASH) & 1 ? `scared-white-${frame}`
          : `scared-${frame}`;
        const { name } = GHOSTS[i];
        if (!released(game, i)) {
          // Waiting in the house: bob half a tile towards the pocket's other row and back, facing the way it goes.
          const down = MAZE[gh.pos.row + 1][gh.pos.col] === CELL.GHOST_HOUSE;
          const [go, back] = down ? ["down", "up"] : ["up", "down"];
          const bob = { "--bob": down ? "50%" : "-50%", "--go": `url(/ghosts/${name}-${go}-0.svg)`, "--back": `url(/ghosts/${name}-${back}-1.svg)` };
          return <div key={name} className="sprite bob" style={{ ...at(gh.pos), ...bob } as React.CSSProperties} />;
        }
        // The ghost just eaten stays hidden behind its points during the freeze.
        const hidden = game.bite && gh.mode === "eyes" && key(gh.pos) === key(game.bite.pos);
        return !hidden && sprite(gh.pos, `/ghosts/${src}.svg`, "sprite", name);
      })}
      {game.bite && (
        <span className="sprite grid place-items-center font-arcade text-[#33ffff] text-[length:calc(var(--maze-cell)/2.5)]" style={at(game.bite.pos)}>
          {game.bite.points}
        </span>
      )}
      <output aria-label="Score" className="absolute right-0 bottom-full pb-2 font-mono text-2xl text-white">
        {game.score}
      </output>
      <div
        role="img"
        aria-label="Pac-Man"
        className="sprite pacman"
        hidden={!!game.bite}
        style={{
          ...at(pos),
          // Sprite faces right at 0deg; atan2 turns [dRow, dCol] into that heading.
          rotate: `${(Math.atan2(dir[0], dir[1]) * 180) / Math.PI}deg`,
        }}
      />
    </div>
    <ul aria-label="Lives" className="flex gap-2 p-2">
      {Array.from({ length: Math.max(0, game.lives - 1) }, (_, i) => (
        <li key={i} className="size-(--maze-cell) bg-[url(/heart.svg)] bg-contain bg-no-repeat" />
      ))}
    </ul>
    </div>
  );
}
