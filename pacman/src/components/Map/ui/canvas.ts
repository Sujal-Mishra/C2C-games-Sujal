import { CELL, MAZE, isWall } from "../game/index.ts";

/** Canvas pixels per tile; drawn oversize and downscaled so the curves stay smooth. */
export const PX = 32;
const WALL_BASE = "#CE7494";
const WALL_LIGHT = "#E3A9BF";
const WALL_DARK = "#963D5D";
/** Bevel thickness; open sides get a light (top/left) or dark (bottom/right) chamfer. */
const BEVEL = Math.round(PX * 0.28);

/**
 * Filled wall block with a 3D bevel: the whole tile is base colour, then any
 * side facing an open cell gets a chamfered strip — light on top/left, dark on
 * bottom/right. Sides adjacent to another wall stay flush so neighbouring
 * blocks merge into one solid mass.
 */
function drawWall(ctx: CanvasRenderingContext2D, row: number, col: number) {
  const up = !isWall(row - 1, col);
  const down = !isWall(row + 1, col);
  const left = !isWall(row, col - 1);
  const right = !isWall(row, col + 1);

  const x = col * PX, y = row * PX, b = BEVEL;

  ctx.fillStyle = WALL_BASE;
  ctx.fillRect(x, y, PX, PX);

  if (up) {
    ctx.fillStyle = WALL_LIGHT;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + PX, y);
    ctx.lineTo(x + (right ? PX - b : PX), y + b);
    ctx.lineTo(x + (left ? b : 0), y + b);
    ctx.closePath();
    ctx.fill();
  }
  if (left) {
    ctx.fillStyle = WALL_LIGHT;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + b, y + (up ? b : 0));
    ctx.lineTo(x + b, y + (down ? PX - b : PX));
    ctx.lineTo(x, y + PX);
    ctx.closePath();
    ctx.fill();
  }
  if (down) {
    ctx.fillStyle = WALL_DARK;
    ctx.beginPath();
    ctx.moveTo(x, y + PX);
    ctx.lineTo(x + (left ? b : 0), y + PX - b);
    ctx.lineTo(x + (right ? PX - b : PX), y + PX - b);
    ctx.lineTo(x + PX, y + PX);
    ctx.closePath();
    ctx.fill();
  }
  if (right) {
    ctx.fillStyle = WALL_DARK;
    ctx.beginPath();
    ctx.moveTo(x + PX, y);
    ctx.lineTo(x + PX, y + PX);
    ctx.lineTo(x + PX - b, y + (down ? PX - b : PX));
    ctx.lineTo(x + PX - b, y + (up ? b : 0));
    ctx.closePath();
    ctx.fill();
  }
}

/** Draws every maze wall once onto a canvas sized `MAZE_COLS x MAZE_ROWS` tiles of `PX` pixels each. */
export function drawMaze(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!;
  MAZE.forEach((line, row) =>
    line.forEach((cell, col) => cell === CELL.WALL && drawWall(ctx, row, col)),
  );
}
