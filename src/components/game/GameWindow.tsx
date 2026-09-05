import React from "react";
import { RoundDefinition } from "../../types/game.types";
import { HsvColor } from "../../game";
import { VerticalSlider } from "./VerticalSlider";
import { StageArea } from "./StageArea";
import { FooterControls } from "./FooterControls";

interface GameWindowProps {
  currentRound: RoundDefinition;
  roundIndex: number;
  totalRounds: number;
  showHint: boolean;
  hintsLeft: number;
  guess: HsvColor;
  guessHex: string;
  satPureHex: string;
  valBrightHex: string;
  onSetGuess: (guess: HsvColor) => void;
  onTriggerHint: () => void;
  onSubmitGuess: () => void;
  onGoLobby: () => void;
}

export function GameWindow({
  currentRound,
  roundIndex,
  totalRounds,
  showHint,
  hintsLeft,
  guess,
  guessHex,
  satPureHex,
  valBrightHex,
  onSetGuess,
  onTriggerHint,
  onSubmitGuess,
  onGoLobby,
}: GameWindowProps) {
  return (
    <div className="game-card-content">
      {/* Left Vertical Color Picker Sliders with Visual Target Hint overlays */}
      <aside className="vertical-color-picker" aria-label="Color Controls">
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
          background={`linear-gradient(to bottom, #fff5f7 0%, ${satPureHex} 50%, #210a13 100%)`}
          onChange={(saturation) => onSetGuess({ ...guess, saturation })}
          showHint={showHint}
          targetHintValue={currentRound.target.saturation}
          hintType="sat"
        />

        <VerticalSlider
          value={guess.value}
          max={100}
          background={`linear-gradient(to bottom, ${valBrightHex} 0%, #310d1d 60%, #0c0307 100%)`}
          onChange={(value) => onSetGuess({ ...guess, value })}
          showHint={showHint}
          targetHintValue={currentRound.target.value}
          hintType="val"
        />
      </aside>

      {/* Right Main Stage & Controls */}
      <div className="stage-area-wrapper" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <StageArea
          currentRound={currentRound}
          roundIndex={roundIndex}
          totalRounds={totalRounds}
          showHint={showHint}
          guessHex={guessHex}
          onGoLobby={onGoLobby}
        />
        <FooterControls
          guessHex={guessHex}
          hintsLeft={hintsLeft}
          showHint={showHint}
          onTriggerHint={onTriggerHint}
          onSubmitGuess={onSubmitGuess}
        />
      </div>
    </div>
  );
}
