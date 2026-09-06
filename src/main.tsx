import React from "react";
import { createRoot } from "react-dom/client";
import { useColorGame } from "./hooks/useColorGame";
import { TopHeader } from "./components/game/TopHeader";
import { GameWindow } from "./components/game/GameWindow";
import { LobbyView } from "./components/views/LobbyView";
import { ResultView } from "./components/views/ResultView";
import { SakuraLanternsBackground } from "./components/ui/SakuraLanternsBackground";
import "./styles.css";
import "./theme.css";

function App() {
  const game = useColorGame();

  return (
    <div className="page-wrapper">
      {/* Background Animated Petals & Lanterns */}
      <SakuraLanternsBackground />

      {/* Top Header Navigation */}
      <TopHeader
        mode={game.mode}
        scoresCount={game.scores.length}
        onSelectMode={game.setMode}
      />

      {/* Main Game Card Window inside Signature C2C Frame */}
      <main className="dialed-card-window c2c-theme-card">
        {game.mode === "playing" && (
          <GameWindow
            currentRound={game.currentRound}
            roundIndex={game.round}
            totalRounds={game.totalRounds}
            subPhase={game.subPhase}
            countdownStep={game.countdownStep}
            memorizeTimeLeft={game.memorizeTimeLeft}
            targetHex={game.targetHex}
            guess={game.guess}
            guessHex={game.guessHex}
            satPureHex={game.satPureHex}
            valBrightHex={game.valBrightHex}
            showHint={game.showHint}
            hintsLeft={game.hintsLeft}
            lastRoundScore={game.lastRoundScore}
            onSetGuess={game.setGuess}
            onTriggerHint={game.triggerHint}
            onSubmitGuess={game.submitGuess}
            onAdvanceToNextRound={game.advanceToNextRound}
          />
        )}

        {game.mode === "lobby" && (
          <LobbyView onQueueRandom={game.queueRandom} />
        )}

        {game.mode === "result" && (
          <ResultView
            score={game.totalScore}
            scores={game.scores}
            onPlayAgain={game.startGame}
          />
        )}
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
