import { useState, useMemo, useEffect, useCallback } from "react";
import { Mode, RoomType, RoundSubPhase, CountdownStep, RoundDefinition } from "../types/game.types";
import { chooseRandomRounds } from "../data/roundsData";
import { calculateRoundScore, hsvToHex, HsvColor } from "../game";

export function useColorGame() {
  const [mode, setMode] = useState<Mode>("playing");
  const [roomType, setRoomType] = useState<RoomType>("random");
  const [activeRounds, setActiveRounds] = useState<RoundDefinition[]>(chooseRandomRounds);
  const [round, setRound] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [lastRoundScore, setLastRoundScore] = useState<number | null>(null);

  // Sub-phase within playing mode
  const [subPhase, setSubPhase] = useState<RoundSubPhase>("countdown");
  const [countdownStep, setCountdownStep] = useState<CountdownStep>("ready");
  const [memorizeTimeLeft, setMemorizeTimeLeft] = useState<number>(3.0);

  const [hintsLeft, setHintsLeft] = useState(2);
  const [showHint, setShowHint] = useState(false);
  const [guess, setGuess] = useState<HsvColor>({
    hue: 330,
    saturation: 65,
    value: 80,
  });

  const currentRound = activeRounds[round] || activeRounds[0];

  const targetHex = useMemo(
    () => (currentRound ? hsvToHex(currentRound.target) : "#ffffff"),
    [currentRound]
  );
  
  const guessHex = useMemo(() => hsvToHex(guess), [guess]);

  const totalScore = useMemo(
    () => scores.reduce((sum, item) => sum + item, 0),
    [scores]
  );

  // Function to initialize & start a round's countdown sequence
  const startRoundCountdown = useCallback(() => {
    setSubPhase("countdown");
    setCountdownStep("ready");
    setMemorizeTimeLeft(3.0);
    setShowHint(false);
    // Stick to the theme pink gradient initially
    setGuess({
      hue: 330,
      saturation: 65,
      value: 80,
    });
  }, []);

  // Countdown timer logic: ready -> black -> set -> black -> go -> memorize
  useEffect(() => {
    if (mode !== "playing" || subPhase !== "countdown") return;

    let timeoutId: ReturnType<typeof setTimeout>;

    if (countdownStep === "ready") {
      timeoutId = setTimeout(() => setCountdownStep("blank1"), 650);
    } else if (countdownStep === "blank1") {
      timeoutId = setTimeout(() => setCountdownStep("set"), 350);
    } else if (countdownStep === "set") {
      timeoutId = setTimeout(() => setCountdownStep("blank2"), 650);
    } else if (countdownStep === "blank2") {
      timeoutId = setTimeout(() => setCountdownStep("go"), 350);
    } else if (countdownStep === "go") {
      timeoutId = setTimeout(() => {
        setCountdownStep("done");
        setSubPhase("memorize");
      }, 650);
    }

    return () => clearTimeout(timeoutId);
  }, [mode, subPhase, countdownStep]);

  // High-precision Memorize 60fps timer: 5.000s countdown to 0.000s
  useEffect(() => {
    if (mode !== "playing" || subPhase !== "memorize") return;

    const durationMs = 3000; // 3-second timer
    const startTimestamp = performance.now();
    let animFrameId: number;

    const tick = () => {
      const elapsed = performance.now() - startTimestamp;
      const remainingMs = Math.max(0, durationMs - elapsed);
      const remainingSec = remainingMs / 1000;

      setMemorizeTimeLeft(remainingSec);

      if (remainingMs > 0) {
        animFrameId = requestAnimationFrame(tick);
      } else {
        setSubPhase("match");
      }
    };

    animFrameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animFrameId);
  }, [mode, subPhase]);

  const startGame = () => {
    setActiveRounds(chooseRandomRounds());
    setRound(0);
    setScores([]);
    setLastRoundScore(null);
    setHintsLeft(2);
    setMode("playing");
    startRoundCountdown();
  };

  const queueRandom = () => {
    setRoomType("random");
    startGame();
  };

  const submitGuess = () => {
    const roundScore = calculateRoundScore(guess, currentRound.target);
    setLastRoundScore(roundScore);
    const nextScores = [...scores, roundScore];
    setScores(nextScores);
    setShowHint(false);
    setSubPhase("feedback");
  };

  const advanceToNextRound = () => {
    if (round >= activeRounds.length - 1) {
      setMode("result");
    } else {
      setRound((prev) => prev + 1);
      startRoundCountdown();
    }
  };

  const triggerHint = () => {
    if (hintsLeft > 0 && !showHint) {
      setHintsLeft((prev) => prev - 1);
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
    lastRoundScore,
    currentRound,
    targetHex,
    subPhase,
    countdownStep,
    memorizeTimeLeft,
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
    advanceToNextRound,
    triggerHint,
  };
}
