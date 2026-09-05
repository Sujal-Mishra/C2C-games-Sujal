import React from "react";
import { RoundDefinition } from "../../types/game.types";
import { DynamicLogo } from "../logos/DynamicLogoRegistry";

interface StageAreaProps {
  currentRound: RoundDefinition;
  roundIndex: number;
  totalRounds: number;
  showHint: boolean;
  guessHex: string;
  onGoLobby: () => void;
}

export function StageArea({
  currentRound,
  roundIndex,
  totalRounds,
  guessHex,
  onGoLobby,
}: StageAreaProps) {
  return (
    <section className="stage-area">
      <header className="card-header">
        <span className="round-indicator">
          {roundIndex + 1} / {totalRounds}
        </span>
        <span className="brand-title" onClick={onGoLobby}>
          <span className="c-mark">C</span> C2C
        </span>
      </header>

      {/* Center Stage with Dynamic Registered Logo */}
      <div className="character-stage">
        <div className="floor-spotlight" />

        <div className="round-hint-bar">
          <span className="hint-label">{currentRound.label}</span>
          <p className="hint-sub">{currentRound.hint}</p>
        </div>

        {/* Dynamic Registered Logo Showcase */}
        <div className="emblem-card-showcase">
          <DynamicLogo
            logoId={currentRound.logoId}
            targetColor={guessHex}
            targetIndex={currentRound.targetFacetIndex}
          />
        </div>
      </div>
    </section>
  );
}
