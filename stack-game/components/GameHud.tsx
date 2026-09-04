interface GameHudProps {
  score: number;
  lives: number;
}

export function GameHud({ score, lives }: GameHudProps) {
  return (
    <aside className="game-status" aria-label="Game status">
      <div className="status-panel">
        <span className="hud-label">Current score</span>
        <output aria-label="Current score" className="score-value" aria-live="polite">{score}</output>
      </div>

      <div className="status-panel">
        <span className="hud-label">Lives</span>
        <output aria-label="Lives remaining" className="lives-value" aria-live="polite">{lives}</output>
        <span className="life-pips" aria-hidden="true">
          {Array.from({ length: 2 }, (_, index) => (
            <span key={index} className={index < lives ? "life-pip is-active" : "life-pip"} />
          ))}
        </span>
      </div>
    </aside>
  );
}
