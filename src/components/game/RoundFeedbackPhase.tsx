import React, { useState, useEffect, useMemo } from "react";
import { HsvColor, calculateAccuracyPercentage } from "../../game";

interface RoundFeedbackPhaseProps {
  roundIndex: number;
  totalRounds: number;
  score: number;
  targetHex: string;
  guessHex: string;
  targetHsv?: HsvColor;
  guessHsv?: HsvColor;
  onNextRound: () => void;
}

export function RoundFeedbackPhase({
  roundIndex,
  totalRounds,
  score,
  targetHex,
  guessHex,
  targetHsv,
  guessHsv,
  onNextRound,
}: RoundFeedbackPhaseProps) {
  // Calculate OKLab perceptual accuracy percentage (0.00% to 100.00%)
  const accuracyScore = useMemo(() => {
    if (targetHsv && guessHsv) {
      return calculateAccuracyPercentage(guessHsv, targetHsv);
    }
    return Math.min(100, Math.max(0, score / 10));
  }, [score, targetHsv, guessHsv]);

  // Smooth Count-Up animation: 0 -> 0.01 -> 0.02 ... -> accuracyScore (e.g. 99.54)
  const [displayScore, setDisplayScore] = useState(0);
  const [isCounterDone, setIsCounterDone] = useState(false);

  useEffect(() => {
    setIsCounterDone(false);
    const duration = 1200; // 1.2s smooth count-up
    const startTimestamp = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTimestamp;
      const progress = Math.min(1, elapsed / duration);
      // Cubic ease-out curve
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = easeOut * accuracyScore;

      setDisplayScore(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayScore(accuracyScore);
        setIsCounterDone(true); // Fade in commentary text after count-up completes!
      }
    };

    const animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [accuracyScore]);

  // Pick witty message based on accuracy percentage
  const wittyMessage = useMemo(() => {
    const acc = accuracyScore;
    if (acc >= 98.8) {
      return "Are you a human spectrophotometer? Absolutely flawless!";
    } else if (acc >= 94.0) {
      return "Close enough that nobody at the party noticed.";
    } else if (acc >= 75.0) {
      return "You memorized vibes, not colors. It didn't work.";
    } else if (acc >= 45.0) {
      return "It's in the same neighborhood... just a different house.";
    } else {
      return "A colorblind dog would have gotten closer.";
    }
  }, [accuracyScore]);

  // Format HSB strings e.g. "H288 S46 B83"
  const guessHsbText = guessHsv
    ? `H${Math.round(guessHsv.hue)} S${Math.round(guessHsv.saturation)} B${Math.round(guessHsv.value)}`
    : `HEX ${guessHex.toUpperCase()}`;

  const targetHsbText = targetHsv
    ? `H${Math.round(targetHsv.hue)} S${Math.round(targetHsv.saturation)} B${Math.round(targetHsv.value)}`
    : `HEX ${targetHex.toUpperCase()}`;

  return (
    <div className="card-phase c2c-split-result-card">
      {/* TOP SECTION: User's Selection */}
      <div
        className="result-split-section result-top-section"
        style={{ backgroundColor: guessHex }}
      >
        <div className="result-section-header">
          <span className="result-round-counter">
            {roundIndex + 1} / {totalRounds}
          </span>
          <div className="result-score-display">
            <span className="result-score-number">
              {displayScore.toFixed(2)}
            </span>
          </div>
        </div>

        <div className={`result-witty-text ${isCounterDone ? "fade-in-visible" : ""}`}>
          {wittyMessage}
        </div>

        <div className="result-meta-block">
          <span className="meta-label">Your selection</span>
          <span className="meta-value">{guessHsbText}</span>
        </div>
      </div>

      {/* BOTTOM SECTION: Original Target */}
      <div
        className="result-split-section result-bottom-section"
        style={{ backgroundColor: targetHex }}
      >
        <div className="result-meta-block">
          <span className="meta-label">Original</span>
          <span className="meta-value">{targetHsbText}</span>
        </div>

        <button
          className="result-next-btn"
          onClick={onNextRound}
          aria-label="Next Round"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </div>
  );
}
