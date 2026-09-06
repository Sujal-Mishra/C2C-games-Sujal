import React from "react";

interface LobbyViewProps {
  onQueueRandom: () => void;
}

export function LobbyView({ onQueueRandom }: LobbyViewProps) {
  return (
    <div className="card-lobby-content">
      <header className="card-header">
        <span className="round-indicator">01 — COLOR MEMORY</span>
        <img src="/C2C Logo.svg" alt="C2C Logo" className="header-mini-logo" />
      </header>
      <div className="lobby-body">
        <div className="lobby-brand-badge-wrapper">
          <img src="/C2C Logo.svg" alt="C2C Emblem" className="lobby-brand-logo-svg" />
        </div>
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
