import { CELL, MAZE, MAZE_COLS, MAZE_ROWS, isWall } from "./level";

/**
 * Walls are one cell thick, so drawing a border only on the sides that face an
 * open cell produces the twin-line hollow walls of the arcade board. Corners are
 * rounded wherever two neighbouring sides are both open.
 */
function wallClassName(row: number, col: number): string {
  const up = !isWall(row - 1, col);
  const down = !isWall(row + 1, col);
  const left = !isWall(row, col - 1);
  const right = !isWall(row, col + 1);

  const classes = ["border-[#2b7fff]"];
  if (up) classes.push("border-t-2");
  if (down) classes.push("border-b-2");
  if (left) classes.push("border-l-2");
  if (right) classes.push("border-r-2");

  if (up && left) classes.push("rounded-tl-[var(--maze-radius)]");
  if (up && right) classes.push("rounded-tr-[var(--maze-radius)]");
  if (down && left) classes.push("rounded-bl-[var(--maze-radius)]");
  if (down && right) classes.push("rounded-br-[var(--maze-radius)]");

  return classes.join(" ");
}

export default function Map() {
  return (
    <div
      className="grid bg-black"
      style={
        {
          "--maze-cell": "clamp(6px, min(3vw, 3vh), 26px)",
          "--maze-radius": "calc(var(--maze-cell) / 2)",
          gridTemplateColumns: `repeat(${MAZE_COLS}, var(--maze-cell))`,
          gridTemplateRows: `repeat(${MAZE_ROWS}, var(--maze-cell))`,
        } as React.CSSProperties
      }
      role="img"
      aria-label="Pac-Man maze"
    >
      {MAZE.map((line, row) =>
        line.map((cell, col) => (
          <div
            key={`${row}-${col}`}
            className={
              cell === CELL.WALL ? wallClassName(row, col) : undefined
            }
          />
        )),
      )}
    </div>
  );
}
