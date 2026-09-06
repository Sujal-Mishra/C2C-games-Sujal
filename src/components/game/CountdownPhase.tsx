import React from "react";
import { CountdownStep } from "../../types/game.types";

interface CountdownPhaseProps {
  roundIndex: number;
  totalRounds: number;
  step: CountdownStep;
}

export function CountdownPhase({
  roundIndex,
  totalRounds,
  step,
}: CountdownPhaseProps) {
  // Determine text to show or empty string during blackout frames
  const textToShow =
    step === "ready" ? "ready" : step === "set" ? "set" : step === "go" ? "go" : "";

  return (
    <div className="card-phase countdown-card">
      <div className="countdown-header">
        <span className="phase-round-counter">
          {roundIndex + 1} / {totalRounds}
        </span>
        {textToShow && (
          <h1 className="countdown-word-display key-pop">{textToShow}</h1>
        )}
      </div>
    </div>
  );
}
