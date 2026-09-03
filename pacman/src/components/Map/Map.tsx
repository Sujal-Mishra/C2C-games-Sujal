"use client";

import { useEffect, useRef } from "react";
import {
  CELL,
  DOTS,
  FRIGHT,
  FRUIT_SPAWN,
  GHOSTS,
  MAZE,
  MAZE_COLS,
  MAZE_ROWS,
  cleared,
  fruitOut,
  key,
  released,
  type Tile,
} from "./game/index.ts";
import { useSounds } from "./ui/audio.ts";
import { useGame } from "./ui/input.ts";
import { PX, drawMaze } from "./ui/canvas.ts";
import { FACE, at, sprite } from "./ui/sprites.tsx";

/** The board: ticks the game, plays its sounds, and draws the maze, dots, fruit, ghosts and Pac-Man. */
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
