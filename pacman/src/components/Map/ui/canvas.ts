import { CELL, MAZE, TELEPORTS, isWall } from "../game/index.ts";

/** Canvas pixels per tile; drawn oversize and downscaled so the curves stay smooth. */
export const PX = 32;
/** Same hue as the sprites but a ramp below their darkest tone, so Pac-Man and the ghosts stay legible against the walls. */
const WALL_BASE = "#FB5276";
const WALL_LIGHT = "#FFB6A3";
const WALL_DARK = "#FF708F";
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
const PORTAL = ["#8A5BFF", "#3FC5FF", "#FFD23F"];

/** `"row,col"` of every teleport mouth -> the colour of the pair it belongs to. */
const PORTAL_AT = new Map(
  TELEPORTS.flatMap(({ endpoints }, i) =>
    endpoints.map((e) => [`${e.y},${e.x}`, PORTAL[i % PORTAL.length]] as const),
  ),
);

/** `#rrggbb` mixed towards black (`f < 1`) or white (`f > 1`), clamped. */
function shade(color: string, f: number): string {
  const n = parseInt(color.slice(1), 16);
  const c = (shift: number) => {
    const v = (n >> shift) & 0xff;
    return Math.round(f <= 1 ? v * f : v + (255 - v) * (f - 1));
  };
  return `rgb(${c(16)} ${c(8)} ${c(0)})`;
}

/**
 * A teleport mouth: a glowing ring lying flat in the corridor, like a hole cut
 * through the floor — a squashed ellipse over a dark well, with the stroke laid
 * down three times at shrinking blur so it blooms outwards and keeps a bright core.
 */
function drawPortal(ctx: CanvasRenderingContext2D, row: number, col: number, color: string) {
  const cx = col * PX + PX / 2, cy = row * PX + PX / 2;
  const rx = PX * 0.38, ry = PX * 0.23;

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
  ctx.fillStyle = shade(color, 0.1); // near-black well, so the ring reads as a band not a disc
  ctx.fill();

  ctx.shadowColor = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = PX * 0.11;
  for (const blur of [PX * 0.9, PX * 0.45, PX * 0.2]) {
    ctx.shadowBlur = blur;
    ctx.stroke();
  }
  // A pale core inside the band gives the rim its lit edge.
  ctx.shadowBlur = 0;
  ctx.lineWidth = PX * 0.045;
  ctx.strokeStyle = shade(color, 1.55);
  ctx.stroke();
  ctx.restore();
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
