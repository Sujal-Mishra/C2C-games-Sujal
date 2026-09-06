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
        <img
          src="/C2C Logo.svg"
          alt="C2C Color Logo"
          className="brand-logo-svg"
        />
      </div>
      <nav className="window-frame-tabs">
        <button
          className={`frame-tab ${mode === "playing" ? "active" : ""}`}
          onClick={() => onSelectMode("playing")}
        >
          Game Window
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
