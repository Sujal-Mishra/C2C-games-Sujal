"use client";

import { useEffect, useRef } from "react";

interface GameOverOverlayProps {
  score: number;
  onRestart: () => void;
}

export function GameOverOverlay({ score, onRestart }: GameOverOverlayProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => buttonRef.current?.focus(), []);

  return (
    <div className="overlay-backdrop">
      <section className="game-over-card" role="dialog" aria-modal="true" aria-labelledby="game-over-title">
        <span className="game-over-mark" aria-hidden="true">✿</span>
        <p className="eyebrow">The blossoms have spoken</p>
        <h2 id="game-over-title">Stack toppled</h2>
        <p className="final-score">Final score: {score}</p>
        <p className="game-over-copy">A steadier stack is only one drop away.</p>
        <button ref={buttonRef} type="button" className="action-button action-button--primary" onClick={onRestart}>
          Play again
        </button>
      </section>
    </div>
  );
}
