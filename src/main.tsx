import React from "react";
import { createRoot } from "react-dom/client";
import { useColorGame } from "./hooks/useColorGame";
import { TopHeader } from "./components/game/TopHeader";
import { GameWindow } from "./components/game/GameWindow";
import { LobbyView } from "./components/views/LobbyView";
import { ResultView } from "./components/views/ResultView";
import "./styles.css";
import "./theme.css";

function App() {
  const game = useColorGame();

  return (
    <div className="page-wrapper">
      {/* Top Header Navigation */}
      <TopHeader
        mode={game.mode}
        scoresCount={game.scores.length}
        onSelectMode={game.setMode}
      />

      {/* Compact Card Window */}
      <main className="dialed-card-window c2c-theme-card">
        {game.mode === "playing" && (
          <GameWindow
            currentRound={game.currentRound}
            roundIndex={game.round}
            totalRounds={game.totalRounds}
            showHint={game.showHint}
            hintsLeft={game.hintsLeft}
            guess={game.guess}
            guessHex={game.guessHex}
            satPureHex={game.satPureHex}
            valBrightHex={game.valBrightHex}
            onSetGuess={game.setGuess}
            onTriggerHint={game.triggerHint}
            onSubmitGuess={game.submitGuess}
            onGoLobby={() => game.setMode("lobby")}
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
