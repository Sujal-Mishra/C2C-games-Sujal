import { useEffect, useRef } from "react";
import { FRUIT_SPAWN, cleared, key, type Game } from "../game/index.ts";

/** Every Audio element ever started through `sound`, so `stopAll` can silence the game in one go. */
const playing = new Set<HTMLAudioElement>();

export const sound = (name: string) => {
  const a = new Audio(`/sounds/${name}`);
  playing.add(a);
  a.addEventListener("ended", () => playing.delete(a)); // one-shots drop out once they finish
  return a;
};

export const play = (name: string) => sound(name).play().catch(() => {});

/** Pauses and rewinds every sound the game has going, one-shots and loops alike. */
export const stopAll = () => {
  playing.forEach((a) => { a.pause(); a.currentTime = 0; });
  playing.clear();
};

/** Arcade sounds off the change between ticks: one-shots for events, loops for the siren and chomping. */
export function useSounds(game: Game) {
  const prev = useRef(game);
  const loops = useRef<Record<string, HTMLAudioElement>>({});
  useEffect(() => {
    const p = prev.current;
    prev.current = game;
    if (!game.lives || cleared(game)) { stopAll(); return; } // the game just ended, win or lose: cut everything, start nothing new
    const loop = (name: string, on: boolean) => {
      const a = (loops.current[name] ??= Object.assign(sound(name), { loop: true }));
      if (!on) a.pause();
      else if (a.paused) a.play().catch(() => {});
    };
    if (game.lives < p.lives) play("die.mp3");
    if (game.lives > p.lives) play("extra-lives.mp3");
    if (game.bite && !p.bite) play("eatghost.mp3");
    if (game.fright > p.fright) play("eatpill.mp3");
    if (p.fruit && !game.fruit && key(game.pos) === key(FRUIT_SPAWN)) play("eatfruit.wav");
    loop("eating.mp3", game.eaten.size > p.eaten.size);
    loop("siren.mp3", game.t > 0 && game.lives > 0 && !cleared(game) && !game.bite); // ponytail: no separate frightened siren
  }, [game]);
  useEffect(() => () => Object.values(loops.current).forEach((a) => a.pause()), []);
}
