interface Props { score: number; }

export function GameOverOverlay({ score }: Props) {
  return (
    <div className="overlay-backdrop">
      <section className="game-over-card wood-board" role="dialog" aria-modal="true" aria-label="Game ended">
        <h1 className="pixel-game-over">Game Over</h1>
        <p className="final-score" aria-live="polite">Score: {score}</p>
      </section>
    </div>
  );
}
