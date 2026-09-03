import { key, type Tile } from "../game/index.ts";

/** Inline position for a `.sprite` sitting on `t`. */
export const at = (t: Tile) => ({
  top: `calc(${t.row} * var(--maze-cell))`,
  left: `calc(${t.col} * var(--maze-cell))`,
});

export const FACE: Record<string, string> = { "-1,0": "up", "1,0": "down", "0,-1": "left", "0,1": "right" };

/** A `.sprite` div for one maze tile, showing `src` as its background image. */
export const sprite = (t: Tile, src: string, className = "sprite", k = key(t)) => (
  <div key={k} className={className} style={{ ...at(t), backgroundImage: `url(${src})` }} />
);
