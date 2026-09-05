import React from "react";
import { Mode } from "../../types/game.types";

interface TopHeaderProps {
  mode: Mode;
  scoresCount: number;
  onSelectMode: (mode: Mode) => void;
}

export function TopHeader({ mode, scoresCount, onSelectMode }: TopHeaderProps) {
  return (
    <header className="theme-topbar">
      <div className="brand" onClick={() => onSelectMode("lobby")}>
        <span className="brand-mark">C</span>
        <span className="brand-name">
          c2c
        </span>
      </div>
      <nav className="window-frame-tabs">
        <button
          className={`frame-tab ${mode === "playing" ? "active" : ""}`}
          onClick={() => onSelectMode("playing")}
        >
          Game Window
        </button>
        <button
          className={`frame-tab ${mode === "lobby" ? "active" : ""}`}
          onClick={() => onSelectMode("lobby")}
        >
          Lobby
        </button>
        {scoresCount > 0 && (
          <button
            className={`frame-tab ${mode === "result" ? "active" : ""}`}
            onClick={() => onSelectMode("result")}
          >
            Results
          </button>
        )}
      </nav>
    </header>
  );
}
