import { CELL, MAZE, TELEPORTS, isWall } from "../game/index.ts";

/** Canvas pixels per tile; drawn oversize and downscaled so the curves stay smooth. */
export const PX = 32;
/** Same hue as the sprites but a ramp below their darkest tone, so Pac-Man and the ghosts stay legible against the walls. */
const WALL_BASE = "#9B3160";
const WALL_LIGHT = "#D46C8C";
const WALL_DARK = "#551B35";
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

/**
 * One colour per teleport pair, so a mouth tells you which other mouth it leads to.
 * Chosen away from the wall pinks and the ghost colours; cycled if a map adds more pairs.
 */
const PORTAL = ["#8A5BFF", "#3FC5FF", "#4BE08A"];

/** `"row,col"` of every teleport mouth -> the colour of the pair it belongs to. */
const PORTAL_AT = new Map(
  TELEPORTS.flatMap(({ endpoints }, i) =>
    endpoints.map((e) => [`${e.y},${e.x}`, PORTAL[i % PORTAL.length]] as const),
  ),
);

/**
 * A teleport mouth: two concentric rings over a dark disc, so it reads as a portal
 * against the black corridor and never gets mistaken for a pellet.
 */
function drawPortal(ctx: CanvasRenderingContext2D, row: number, col: number, color: string) {
  const cx = col * PX + PX / 2, cy = row * PX + PX / 2;
  const ring = (r: number, width: number, style: string) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.lineWidth = width;
    ctx.strokeStyle = style;
    ctx.stroke();
  };

  ctx.beginPath();
  ctx.arc(cx, cy, PX * 0.42, 0, 2 * Math.PI);
  ctx.fillStyle = "#1A0A12";
  ctx.fill();

  ring(PX * 0.36, PX * 0.1, color);
  ring(PX * 0.19, PX * 0.07, color);
}

/** Draws every maze wall once onto a canvas sized `MAZE_COLS x MAZE_ROWS` tiles of `PX` pixels each. */
export function drawMaze(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!;
  MAZE.forEach((line, row) =>
    line.forEach((cell, col) => cell === CELL.WALL && drawWall(ctx, row, col)),
  );
  // Portals go on top, so a mouth tucked against a wall still reads.
  MAZE.forEach((line, row) =>
    line.forEach((cell, col) => {
      const color = cell === CELL.TELEPORT && PORTAL_AT.get(`${row},${col}`);
      if (color) drawPortal(ctx, row, col, color);
    }),
  );
}
