import { useEffect, useRef, useState } from "react";
import { NEW_GAME, TICK_MS, tick, type Dir } from "../game/index.ts";
import { sound } from "./audio.ts";

const STOP: Dir = [0, 0];
const KEYS: Record<string, Dir> = {
  arrowup: [-1, 0], w: [-1, 0],
  arrowdown: [1, 0], s: [1, 0],
  arrowleft: [0, -1], a: [0, -1],
  arrowright: [0, 1], d: [0, 1],
};

/**
 * Game state, advanced on a fixed tick; the arrow keys / WASD set where Pac-Man wants to go.
 * The board waits for the first key, which plays the opening jingle; ticking starts when it ends.
 */
export function useGame() {
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
