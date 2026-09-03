import { CELL, MAZE, isWall } from "../game/index.ts";

/** Canvas pixels per tile; drawn oversize and downscaled so the curves stay smooth. */
export const PX = 32;
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

/** Draws every maze wall once onto a canvas sized `MAZE_COLS x MAZE_ROWS` tiles of `PX` pixels each. */
export function drawMaze(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!;
  ctx.strokeStyle = WALL_COLOR;
  ctx.lineWidth = LINE;
  MAZE.forEach((line, row) =>
    line.forEach((cell, col) => cell === CELL.WALL && drawWall(ctx, row, col)),
  );
}
