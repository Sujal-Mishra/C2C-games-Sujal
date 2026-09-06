import React from "react";

interface MemorizePhaseProps {
  roundIndex: number;
  totalRounds: number;
  targetHex: string;
  timeLeft: number;
}

export function MemorizePhase({
  roundIndex,
  totalRounds,
  targetHex,
  timeLeft,
}: MemorizePhaseProps) {
  // Rapid 2-digit decimals: e.g. 3.44 -> intPart = "3", decPart = "44"
  const formattedTime = timeLeft.toFixed(2);
  const [intPart, decPart] = formattedTime.split(".");

  return (
    <div
      className="card-phase memorize-card"
      style={{ backgroundColor: targetHex }}
    >
      <header className="memorize-header">
        <span className="memorize-round-tag">
          {roundIndex + 1} / {totalRounds}
        </span>

        <div className="memorize-timer-block">
          <div className="timer-number-huge">
            <span className="timer-digit-int">{intPart}</span>
            <span className="timer-digit-dec">{decPart}</span>
          </div>
          <span className="timer-sublabel">Seconds to remember</span>
        </div>
      </header>

      <footer className="memorize-footer">
        <img src="/C2C Logo.svg" alt="C2C Logo" className="phase-card-logo-svg" />
      </footer>
    </div>
  );
}
