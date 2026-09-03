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
  fruitOut,
  isWall,
  key,
  released,
  tick,
  type Dir,
  type Tile,
} from "./level";

const STOP: Dir = [0, 0];
const KEYS: Record<string, Dir> = {
  arrowup: [-1, 0], w: [-1, 0],
  arrowdown: [1, 0], s: [1, 0],
  arrowleft: [0, -1], a: [0, -1],
  arrowright: [0, 1], d: [0, 1],
};

/** Game state, advanced on a fixed tick; the arrow keys / WASD set where Pac-Man wants to go. */
function useGame() {
  const [game, setGame] = useState(NEW_GAME);
  const want = useRef(STOP);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const d = KEYS[e.key.toLowerCase()];
      if (!d) return;
      want.current = d;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    const timer = setInterval(() => setGame((g) => tick(g, want.current)), TICK_MS);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearInterval(timer);
    };
  }, []);

  return game;
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

/** Arcade tile size. The board is drawn at this resolution and upscaled with `image-rendering: pixelated`. */
const PX = 8;
const WALL_COLOR = "#2b7fff";

/**
 * Walls are one cell thick, so drawing a 1px line only on the sides that face an
 * open cell produces the twin-line hollow walls of the arcade board. Corners are
 * quarter-circles (radius = half a cell) wherever two neighbouring sides are both
 * open — at 8px they rasterise into the boxy curves of the original.
 */
function drawWall(ctx: CanvasRenderingContext2D, row: number, col: number) {
  const up = !isWall(row - 1, col);
  const down = !isWall(row + 1, col);
  const left = !isWall(row, col - 1);
  const right = !isWall(row, col + 1);
  const tl = up && left, tr = up && right, bl = down && left, br = down && right;

  const x = col * PX, y = row * PX, r = PX / 2, cx = x + r, cy = y + r;
  // Inset by half a pixel so 1px lines land on whole pixels.
  const lo = 0.5, hi = PX - 0.5;

  ctx.beginPath();
  if (up) { ctx.moveTo(x + (tl ? r : 0), y + lo); ctx.lineTo(x + PX - (tr ? r : 0), y + lo); }
  if (down) { ctx.moveTo(x + (bl ? r : 0), y + hi); ctx.lineTo(x + PX - (br ? r : 0), y + hi); }
  if (left) { ctx.moveTo(x + lo, y + (tl ? r : 0)); ctx.lineTo(x + lo, y + PX - (bl ? r : 0)); }
  if (right) { ctx.moveTo(x + hi, y + (tr ? r : 0)); ctx.lineTo(x + hi, y + PX - (br ? r : 0)); }
  ctx.stroke();

  const arc = (from: number, to: number) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r - 0.5, from * Math.PI, to * Math.PI);
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
  ctx.lineWidth = 1;
  MAZE.forEach((line, row) =>
    line.forEach((cell, col) => cell === CELL.WALL && drawWall(ctx, row, col)),
  );

  // Canvas anti-aliases the arcs; snap every pixel to on/off so the curves are
  // real pixel steps rather than blurry blobs once upscaled.
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  for (let i = 3; i < d.length; i += 4) d[i] = d[i] > 127 ? 255 : 0;
  ctx.putImageData(img, 0, 0);
}

export default function Map() {
  const game = useGame();
  const { pos, dir } = game;
  const left = (t: Tile) => !game.eaten.has(key(t));
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => drawMaze(canvas.current!), []);

  return (
    <div
      className="relative bg-black"
      style={{ "--maze-cell": "clamp(6px, min(3vw, 3vh), 26px)" } as React.CSSProperties}
    >
      <canvas
        ref={canvas}
        width={MAZE_COLS * PX}
        height={MAZE_ROWS * PX}
        role="img"
        aria-label="Pac-Man maze"
        className="block [image-rendering:pixelated]"
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
        const src = !game.fright
          ? `${GHOSTS[i].name}-${FACE[String(gh.dir)] ?? "up"}-${frame}`
          : game.fright <= FRIGHT.flash && game.t & 1
            ? `scared-white-${frame}`
            : `scared-${frame}`;
        return released(game, i) && sprite(gh.pos, `/ghosts/${src}.svg`, "sprite", GHOSTS[i].name);
      })}
      <output aria-label="Score" className="fixed top-4 right-4 font-mono text-2xl text-white">
        {game.score}
      </output>
      <div
        role="img"
        aria-label="Pac-Man"
        className="sprite pacman"
        style={{
          ...at(pos),
          // Sprite faces right at 0deg; atan2 turns [dRow, dCol] into that heading.
          rotate: `${(Math.atan2(dir[0], dir[1]) * 180) / Math.PI}deg`,
        }}
      />
    </div>
  );
}
