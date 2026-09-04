import { INITIAL_LIVES } from "@/game/rules";

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
        <output aria-label="Lives remaining" className="life-pips" aria-live="polite">
          <span className="visually-hidden">{lives}</span>
          {Array.from({ length: INITIAL_LIVES }, (_, index) => (
            <span
              key={index}
              aria-hidden="true"
              className={index < lives ? "life-pip is-active" : "life-pip"}
            />
          ))}
        </output>
      </div>
    </aside>
  );
}
