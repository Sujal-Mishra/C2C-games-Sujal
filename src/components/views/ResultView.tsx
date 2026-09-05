import React from "react";

interface ResultViewProps {
  score: number;
  scores: number[];
  onPlayAgain: () => void;
}

export function ResultView({ score, scores, onPlayAgain }: ResultViewProps) {
  return (
    <div className="card-result-content">
      <header className="card-header">
        <span className="round-indicator">MATCH COMPLETE</span>
        <span className="brand-title">C2C</span>
      </header>
      <div className="result-body">
        <span className="result-label">FINAL SCORE</span>
        <h1 className="result-score-num">{score.toLocaleString()}</h1>
        <span className="result-max">out of 5,000</span>

        <div className="result-mini-breakdown">
          {scores.map((s, idx) => (
            <div key={idx} className="mini-score-row">
              <span>Round 0{idx + 1}</span>
              <b>{s} pts</b>
            </div>
          ))}
        </div>

        <button className="btn-start-primary" onClick={onPlayAgain}>
          Play Again →
        </button>
      </div>
    </div>
  );
}
