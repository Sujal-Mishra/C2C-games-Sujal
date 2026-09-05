import React from "react";

interface LobbyViewProps {
  onQueueRandom: () => void;
}

export function LobbyView({ onQueueRandom }: LobbyViewProps) {
  return (
    <div className="card-lobby-content">
      <header className="card-header">
        <span className="round-indicator">01 — COLOR MEMORY</span>
        <span className="brand-title">C2C</span>
      </header>
      <div className="lobby-body">
        <div className="lobby-brand-badge">C</div>
        <h2>How close can you get?</h2>
        <p>
          Study the emblem. Tune the vertical color sliders from memory. Chase
          the highest score across 5 rapid rounds.
        </p>
        <div className="lobby-actions">
          <button className="btn-start-primary" onClick={onQueueRandom}>
            Play Random Room →
          </button>
        </div>
      </div>
    </div>
  );
}
