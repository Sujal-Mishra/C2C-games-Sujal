import React from "react";
import { LampIcon, TargetIcon } from "../ui/Icons";

interface FooterControlsProps {
  guessHex: string;
  hintsLeft: number;
  showHint: boolean;
  onTriggerHint: () => void;
  onSubmitGuess: () => void;
}

export function FooterControls({
  guessHex,
  hintsLeft,
  showHint,
  onTriggerHint,
  onSubmitGuess,
}: FooterControlsProps) {
  return (
    <footer className="card-footer">
      <div className="hex-display">
        <span>HEX</span>
        <b>{guessHex.toUpperCase()}</b>
      </div>

      <div className="footer-right-buttons">
        <button
          className="action-btn hint-btn"
          onClick={onTriggerHint}
          title="Use Hint"
          disabled={hintsLeft === 0 || showHint}
        >
          <LampIcon />
          <span className="badge">{hintsLeft}</span>
        </button>

        <button
          className="action-btn lock-btn"
          onClick={onSubmitGuess}
          title="Lock Colour"
        >
          <TargetIcon />
        </button>
      </div>
    </footer>
  );
}
