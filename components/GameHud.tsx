import type { GamePhase, ShapeType } from "@/game/types";

interface GameHudProps {
  score: number;
  nextShape: ShapeType;
  phase: GamePhase;
  onRotate: () => void;
  onDrop: () => void;
}

function ShapePreview({ shape }: { shape: ShapeType }) {
  return (
    <span className={`shape-preview shape-preview--${shape}`} aria-hidden="true">
      <span />
    </span>
  );
}

export function GameHud({ score, nextShape, phase, onRotate, onDrop }: GameHudProps) {
  const canAim = phase === "aiming";
  return (
    <>
      <div className="hud-panel score-panel">
        <span className="hud-label">Score</span>
        <output aria-label="Score" className="score-value" aria-live="polite">
          {score}
        </output>
      </div>

      <div className="hud-panel next-panel">
        <span className="hud-label">Next object</span>
        <ShapePreview shape={nextShape} />
      </div>

      <div className="game-actions" aria-label="Game controls">
        <button type="button" className="action-button action-button--secondary" onClick={onRotate} disabled={!canAim}>
          <span className="button-icon" aria-hidden="true">↻</span>
          Rotate
        </button>
        <button type="button" className="action-button action-button--primary" onClick={onDrop} disabled={!canAim}>
          <span className="button-icon" aria-hidden="true">↓</span>
          Drop
        </button>
      </div>
    </>
  );
}
