import React from "react";
import { RoundDefinition } from "../../types/game.types";
import { HsvColor } from "../../game";
import { VerticalSlider } from "./VerticalSlider";
import { TargetIcon, LampIcon } from "../ui/Icons";

interface MatchPhaseProps {
  currentRound: RoundDefinition;
  roundIndex: number;
  totalRounds: number;
  guess: HsvColor;
  guessHex: string;
  satPureHex: string;
  valBrightHex: string;
  showHint: boolean;
  hintsLeft: number;
  onSetGuess: (guess: HsvColor) => void;
  onTriggerHint: () => void;
  onSubmitGuess: () => void;
}

export function MatchPhase({
  currentRound,
  roundIndex,
  totalRounds,
  guess,
  guessHex,
  satPureHex,
  valBrightHex,
  showHint,
  hintsLeft,
  onSetGuess,
  onTriggerHint,
  onSubmitGuess,
}: MatchPhaseProps) {
  return (
    <div className="card-phase match-card" style={{ backgroundColor: guessHex }}>
      {/* 3 Left Vertical Sliders overlay */}
      <aside className="match-sliders-sidebar" aria-label="Color Pickers">
        <VerticalSlider
          value={guess.hue}
          max={360}
          background="linear-gradient(to bottom, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)"
          onChange={(hue) => onSetGuess({ ...guess, hue })}
          showHint={showHint}
          targetHintValue={currentRound.target.hue}
          hintType="hue"
        />

        <VerticalSlider
          value={guess.saturation}
          max={100}
          background={`linear-gradient(to bottom, #ffffff 0%, ${satPureHex} 50%, #111111 100%)`}
          onChange={(saturation) => onSetGuess({ ...guess, saturation })}
          showHint={showHint}
          targetHintValue={currentRound.target.saturation}
          hintType="sat"
        />

        <VerticalSlider
          value={guess.value}
          max={100}
          background={`linear-gradient(to bottom, ${valBrightHex} 0%, #333333 60%, #000000 100%)`}
          onChange={(value) => onSetGuess({ ...guess, value })}
          showHint={showHint}
          targetHintValue={currentRound.target.value}
          hintType="val"
        />
      </aside>

      {/* Main Pick Content */}
      <div className="match-main-content">
        <header className="match-header">
          <span className="match-round-tag">
            {roundIndex + 1} / {totalRounds}
          </span>
          <img src="/C2C Logo.svg" alt="C2C Logo" className="phase-card-logo-svg" />
        </header>

        <footer className="match-footer">
          {hintsLeft > 0 && (
            <button
              className="hint-float-btn"
              onClick={onTriggerHint}
              disabled={showHint}
              title="Use visual hint"
            >
              <LampIcon />
              <span className="hint-count-badge">{hintsLeft}</span>
            </button>
          )}

          <button
            className="match-submit-btn"
            onClick={onSubmitGuess}
            title="Submit match"
          >
            <TargetIcon />
          </button>
        </footer>
      </div>
    </div>
  );
}
