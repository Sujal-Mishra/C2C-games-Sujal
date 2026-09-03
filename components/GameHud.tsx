import type { GamePhase, ShapeType } from "@/game/types";

interface GameHudProps {
  score: number;
  bestScore?: number;
  nextShape: ShapeType;
  phase: GamePhase;
  onRotate: () => void;
  onDrop: () => void;
  onMenu?: () => void;
}

function ShapePreview({ shape }: { shape: ShapeType }) {
  return (
    <span className={`shape-preview shape-preview--${shape}`} aria-hidden="true">
      <span />
    </span>
  );
}

export function GameHud({ score, bestScore = 0, nextShape, phase, onRotate, onDrop, onMenu }: GameHudProps) {
  const canAim = phase === "aiming";
  return (
    <>
      <div className="hud-panel score-panel">
        <span className="hud-label">Current score</span>
        <output aria-label="Current score" className="score-value" aria-live="polite">{score}</output>
      </div>

      <div className="hud-panel score-panel">
        <span className="hud-label">Best score</span>
        <output aria-label="Best score" className="score-value">{bestScore}</output>
      </div>

      <div className="hud-panel next-panel">
        <span className="hud-label">Next object</span>
        <ShapePreview shape={nextShape} />
      </div>

      <div className="game-actions" aria-label="Game controls">
        {onMenu && <button type="button" className="icon-button menu-button" aria-label="Open menu" onClick={onMenu}>☰</button>}
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
