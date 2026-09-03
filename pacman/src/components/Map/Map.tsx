"use client";

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
  type Dir,
  type Game,
  type Tile,
} from "./level";

const STOP: Dir = [0, 0];
const KEYS: Record<string, Dir> = {
  arrowup: [-1, 0], w: [-1, 0],
  arrowdown: [1, 0], s: [1, 0],
  arrowleft: [0, -1], a: [0, -1],
  arrowright: [0, 1], d: [0, 1],
};

/** Every Audio element ever started through `sound`, so `stopAll` can silence the game in one go. */
const playing = new Set<HTMLAudioElement>();

const sound = (name: string) => {
  const a = new Audio(`/sounds/${name}`);
  playing.add(a);
  a.addEventListener("ended", () => playing.delete(a)); // one-shots drop out once they finish
  return a;
};

const play = (name: string) => sound(name).play().catch(() => {});

/** Pauses and rewinds every sound the game has going, one-shots and loops alike. */
const stopAll = () => {
  playing.forEach((a) => { a.pause(); a.currentTime = 0; });
  playing.clear();
};

/**
 * Game state, advanced on a fixed tick; the arrow keys / WASD set where Pac-Man wants to go.
 * The board waits for the first key, which plays the opening jingle; ticking starts when it ends.
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
    const timer = setInterval(() => go.current && setGame((g) => tick(g, want.current)), TICK_MS);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearInterval(timer);
    };
  }, []);

  return game;
}

/** Arcade sounds off the change between ticks: one-shots for events, loops for the siren and chomping. */
function useSounds(game: Game) {
  const prev = useRef(game);
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
    loop("eating.mp3", game.eaten.size > p.eaten.size);
    loop("siren.mp3", game.t > 0 && game.lives > 0 && !cleared(game) && !game.bite); // ponytail: no separate frightened siren
  }, [game]);
  useEffect(() => () => Object.values(loops.current).forEach((a) => a.pause()), []);
}

/** Inline position for a `.sprite` sitting on `t`. */
const at = (t: Tile) => ({
  top: `calc(${t.row} * var(--maze-cell))`,
  left: `calc(${t.col} * var(--maze-cell))`,
});

const FACE: Record<string, string> = { "-1,0": "up", "1,0": "down", "0,-1": "left", "0,1": "right" };

const sprite = (t: Tile, src: string, className = "sprite", k = key(t)) => (
  <div key={k} className={className} style={{ ...at(t), backgroundImage: `url(${src})` }} />
);

/** Canvas pixels per tile; drawn oversize and downscaled so the curves stay smooth. */
const PX = 32;
const LINE = 2;
const WALL_COLOR = "#2b7fff";

/**
 * Walls are one cell thick, so drawing a line only on the sides that face an
 * open cell produces the twin-line hollow walls of the arcade board. Corners are
 * quarter-circles (radius = half a cell) wherever two neighbouring sides are both open.
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

function drawMaze(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!;
  ctx.strokeStyle = WALL_COLOR;
  ctx.lineWidth = LINE;
  MAZE.forEach((line, row) =>
    line.forEach((cell, col) => cell === CELL.WALL && drawWall(ctx, row, col)),
  );
}

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
        const frame = (game.t >> 1) & 1;
        const face = FACE[String(gh.dir)] ?? "up";
        const src =
          gh.mode === "eyes" ? `eyes-${face}`
          : gh.mode === "normal" ? `${GHOSTS[i].name}-${face}-${frame}`
          : game.fright <= FRIGHT.flash && game.t & 1 ? `scared-white-${frame}`
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
