"use client";

import { useEffect, useRef, useState } from "react";
import {
  CELL,
  MAZE,
  MAZE_COLS,
  MAZE_ROWS,
  PACMAN_SPAWN,
  advance,
  isWall,
  type Dir,
} from "./level";

const STOP: Dir = [0, 0];
const KEYS: Record<string, Dir> = {
  arrowup: [-1, 0], w: [-1, 0],
  arrowdown: [1, 0], s: [1, 0],
  arrowleft: [0, -1], a: [0, -1],
  arrowright: [0, 1], d: [0, 1],
};
const TICK_MS = 150; // ms per tile: bigger = slower

/** Pac-Man's tile and heading, driven by the arrow keys / WASD on a fixed tick. */
function usePacman() {
  const [pac, setPac] = useState({ pos: PACMAN_SPAWN, dir: STOP });
  const want = useRef(STOP);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const d = KEYS[e.key.toLowerCase()];
      if (!d) return;
      want.current = d;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    const tick = setInterval(
      () => setPac((p) => advance(p.pos, want.current, p.dir)),
      TICK_MS,
    );
    return () => {
      window.removeEventListener("keydown", onKey);
      clearInterval(tick);
    };
  }, []);

  return pac;
}

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
  const { pos, dir } = usePacman();
  return (
    <div
      className="relative grid bg-black"
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
      <div
        role="img"
        aria-label="Pac-Man"
        className="pacman"
        style={{
          top: `calc(${pos.row} * var(--maze-cell))`,
          left: `calc(${pos.col} * var(--maze-cell))`,
          // Sprite faces right at 0deg; atan2 turns [dRow, dCol] into that heading.
          rotate: `${(Math.atan2(dir[0], dir[1]) * 180) / Math.PI}deg`,
        }}
      />
    </div>
  );
}
