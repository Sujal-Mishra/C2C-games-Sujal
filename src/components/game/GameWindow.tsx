import React from "react";
import { RoundDefinition, RoundSubPhase, CountdownStep } from "../../types/game.types";
import { HsvColor } from "../../game";
import { CountdownPhase } from "./CountdownPhase";
import { MemorizePhase } from "./MemorizePhase";
import { MatchPhase } from "./MatchPhase";
import { RoundFeedbackPhase } from "./RoundFeedbackPhase";

interface GameWindowProps {
  currentRound: RoundDefinition;
  roundIndex: number;
  totalRounds: number;
  subPhase: RoundSubPhase;
  countdownStep: CountdownStep;
  memorizeTimeLeft: number;
  targetHex: string;
  guess: HsvColor;
  guessHex: string;
  satPureHex: string;
  valBrightHex: string;
  showHint: boolean;
  hintsLeft: number;
  lastRoundScore: number | null;
  onSetGuess: (guess: HsvColor) => void;
  onTriggerHint: () => void;
  onSubmitGuess: () => void;
  onAdvanceToNextRound: () => void;
}

export function GameWindow({
  currentRound,
  roundIndex,
  totalRounds,
  subPhase,
  countdownStep,
  memorizeTimeLeft,
  targetHex,
  guess,
  guessHex,
  satPureHex,
  valBrightHex,
  showHint,
  hintsLeft,
  lastRoundScore,
  onSetGuess,
  onTriggerHint,
  onSubmitGuess,
  onAdvanceToNextRound,
}: GameWindowProps) {
  if (subPhase === "countdown") {
    return (
      <CountdownPhase
        roundIndex={roundIndex}
        totalRounds={totalRounds}
        step={countdownStep}
      />
    );
  }

  if (subPhase === "memorize") {
    return (
      <MemorizePhase
        roundIndex={roundIndex}
        totalRounds={totalRounds}
        targetHex={targetHex}
        timeLeft={memorizeTimeLeft}
      />
    );
  }

  if (subPhase === "match") {
    return (
      <MatchPhase
        currentRound={currentRound}
        roundIndex={roundIndex}
        totalRounds={totalRounds}
        guess={guess}
        guessHex={guessHex}
        satPureHex={satPureHex}
        valBrightHex={valBrightHex}
        showHint={showHint}
        hintsLeft={hintsLeft}
        onSetGuess={onSetGuess}
        onTriggerHint={onTriggerHint}
        onSubmitGuess={onSubmitGuess}
      />
    );
  }

  if (subPhase === "feedback") {
    return (
      <RoundFeedbackPhase
        roundIndex={roundIndex}
        totalRounds={totalRounds}
        score={lastRoundScore ?? 0}
        targetHex={targetHex}
        guessHex={guessHex}
        targetHsv={currentRound.target}
        guessHsv={guess}
        onNextRound={onAdvanceToNextRound}
      />
    );
  }

  return null;
}
