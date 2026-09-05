import { useState, useMemo } from "react";
import { Mode, RoomType } from "../types/game.types";
import { chooseRandomRounds } from "../data/roundsData";
import { RoundDefinition } from "../types/game.types";
import { calculateRoundScore, hsvToHex, HsvColor } from "../game";

export function useColorGame() {
  const [mode, setMode] = useState<Mode>("playing");
  const [roomType, setRoomType] = useState<RoomType>("random");
  const [activeRounds, setActiveRounds] = useState<RoundDefinition[]>(chooseRandomRounds);
  const [round, setRound] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [hintsLeft, setHintsLeft] = useState(2);
  const [showHint, setShowHint] = useState(false);
  const [guess, setGuess] = useState<HsvColor>({
    hue: 330,
    saturation: 65,
    value: 80,
  });

  const totalScore = useMemo(
    () => scores.reduce((sum, item) => sum + item, 0),
    [scores]
  );
  
  const currentRound = activeRounds[round] || activeRounds[0];
  const guessHex = useMemo(() => hsvToHex(guess), [guess]);

  const startGame = () => {
    setActiveRounds(chooseRandomRounds());
    setRound(0);
    setScores([]);
    setGuess({ hue: 330, saturation: 65, value: 80 });
    setHintsLeft(2);
    setShowHint(false);
    setMode("playing");
  };

  const queueRandom = () => {
    setRoomType("random");
    startGame();
  };

  const submitGuess = () => {
    const roundScore = calculateRoundScore(guess, currentRound.target);
    const nextScores = [...scores, roundScore];
    setShowHint(false);
    if (round === activeRounds.length - 1) {
      setScores(nextScores);
      setMode("result");
    } else {
      setScores(nextScores);
      setRound(round + 1);
      setGuess({ hue: (guess.hue + 50) % 360, saturation: 60, value: 78 });
    }
  };

  const triggerHint = () => {
    if (hintsLeft > 0 && !showHint) {
      setHintsLeft(hintsLeft - 1);
      setShowHint(true);
    }
  };

  const satPureHex = useMemo(
    () => hsvToHex({ hue: guess.hue, saturation: 100, value: 100 }),
    [guess.hue]
  );
  const valBrightHex = useMemo(
    () => hsvToHex({ hue: guess.hue, saturation: guess.saturation, value: 100 }),
    [guess.hue, guess.saturation]
  );

  return {
    mode,
    setMode,
    roomType,
    round,
    totalRounds: activeRounds.length,
    scores,
    totalScore,
    currentRound,
    hintsLeft,
    showHint,
    guess,
    guessHex,
    satPureHex,
    valBrightHex,
    setGuess,
    startGame,
    queueRandom,
    submitGuess,
    triggerHint,
  };
}
