"use client";

import { useEffect, useRef } from "react";

interface Props { score: number; bestScore: number; showScore: boolean; onRetry: () => void; onViewScore: () => void; }

export function GameOverOverlay({ score, bestScore, showScore, onRetry, onViewScore }: Props) {
  const retryRef = useRef<HTMLButtonElement>(null);
  useEffect(() => retryRef.current?.focus(), []);
  return (
    <div className="overlay-backdrop">
      <section className="game-over-card" role="dialog" aria-modal="true" aria-label="Game ended">
        {showScore && <div className="score-details" aria-live="polite"><p>Run score: {score}</p><p>Best score: {bestScore}</p></div>}
        <div className="end-actions">
          <button ref={retryRef} type="button" className="action-button action-button--primary" onClick={onRetry}>Retry</button>
          <button type="button" className="action-button" onClick={onViewScore}>View score</button>
        </div>
      </section>
    </div>
  );
}
