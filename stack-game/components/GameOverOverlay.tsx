interface Props { totalScore: number; }

export function GameOverOverlay({ totalScore }: Props) {
  return (
    <div className="overlay-backdrop">
      <section className="game-over-card wood-board" role="dialog" aria-modal="true" aria-label="Game ended">
        <h1 className="pixel-game-over pixel-font etched-wood-text" aria-label="Game Over">
          <span className="game-over-wordmark-line">Game</span>
          <span className="game-over-wordmark-line game-over-wordmark-line--lower">Over</span>
        </h1>
        <p className="final-score etched-wood-text" aria-live="polite">Total score: {totalScore}</p>
      </section>
    </div>
  );
}
