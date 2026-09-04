"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { GameCanvas, type GameCanvasHandle } from "./GameCanvas";
import { GameHud } from "./GameHud";
import { GameMenu } from "./GameMenu";
import { GameOverOverlay } from "./GameOverOverlay";
import {
  AIM_MOVE_STEP,
  INITIAL_LIVES,
  loseLife,
  pickShape,
  POINTS_PER_PIECE,
  rotateQuarterTurn
} from "@/game/rules";
import { createLocalScoreStore, updateBestScore } from "@/game/scoreStore";
import type { GamePhase, QuarterTurn, ShapeType } from "@/game/types";

export function LogoStackGame() {
  const canvasRef = useRef<GameCanvasHandle>(null);
  const petalsRef = useRef<HTMLDivElement>(null);
  const scoreStoreRef = useRef(createLocalScoreStore());
  const livesRef = useRef(INITIAL_LIVES);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [bestScore, setBestScore] = useState(0);
  const [phase, setPhase] = useState<GamePhase>("aiming");
  const [menuOpen, setMenuOpen] = useState(false);
  const [ended, setEnded] = useState(false);
  const [showScore, setShowScore] = useState(false);
  const [rotation, setRotation] = useState<QuarterTurn>(0);
  const [currentShape, setCurrentShape] = useState<ShapeType>("logo");
  const [nextShape, setNextShape] = useState<ShapeType>("blossom");
  const [runId, setRunId] = useState(0);
  const [pieceId, setPieceId] = useState(0);

  const rotate = useCallback(() => {
    if (phase !== "aiming") return;
    canvasRef.current?.rotate();
    setRotation((turn) => rotateQuarterTurn(turn));
  }, [phase]);

  const drop = useCallback(() => {
    if (phase !== "aiming") return;
    canvasRef.current?.drop();
    setPhase("falling");
  }, [phase]);

  const startNextPiece = useCallback(() => {
    setCurrentShape(nextShape);
    setNextShape(pickShape());
    setRotation(0);
    setPieceId((value) => value + 1);
    setPhase("aiming");
  }, [nextShape]);

  const handleLocked = useCallback(() => {
    setScore((value) => {
      const nextScore = value + POINTS_PER_PIECE;
      setBestScore((best) => updateBestScore(nextScore, best, scoreStoreRef.current));
      return nextScore;
    });
    startNextPiece();
  }, [startNextPiece]);

  const startFreshLife = useCallback(() => {
    setScore(0);
    setPhase("aiming");
    setRotation(0);
    setCurrentShape(pickShape());
    setNextShape(pickShape());
    setPieceId(0);
    setRunId((value) => value + 1);
  }, []);

  const handlePieceMissed = useCallback(() => {
    const remainingLives = loseLife(livesRef.current);
    livesRef.current = remainingLives;
    setLives(remainingLives);
    if (remainingLives > 0) startFreshLife();
    return remainingLives > 0;
  }, [startFreshLife]);

  const endGame = useCallback(() => {
    setMenuOpen(false);
    setShowScore(false);
    setEnded(true);
    setPhase("gameOver");
  }, []);

  const handleGameOver = useCallback(() => endGame(), [endGame]);

  const restart = useCallback(() => {
    livesRef.current = INITIAL_LIVES;
    setLives(INITIAL_LIVES);
    setMenuOpen(false);
    setEnded(false);
    setShowScore(false);
    startFreshLife();
  }, [startFreshLife]);

  useEffect(() => {
    setBestScore(scoreStoreRef.current.readBest());
  }, []);

  useEffect(() => {
    const petals = petalsRef.current?.querySelectorAll("i");
    if (!petals || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.set(petals, { y: -40, x: 0, opacity: 0, rotation: 0 });
      petals.forEach((petal, index) => {
        gsap.to(petal, { y: "105vh", x: `random(-42, 42)`, rotation: `random(-180, 180)`, opacity: `random(.12, .32)`, duration: `random(10, 16)`, delay: index * .7, repeat: -1, ease: "none" });
      });
    }, petalsRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (event.key === "Escape" && !ended) {
        event.preventDefault();
        setMenuOpen((open) => !open);
        return;
      }
      if (menuOpen || ended) return;
      if (phase !== "aiming") return;
      if (key === "arrowleft" || key === "arrowright" || key === "a" || key === "d") {
        event.preventDefault();
        canvasRef.current?.moveBy(key === "arrowleft" || key === "a" ? -AIM_MOVE_STEP : AIM_MOVE_STEP);
      } else if (event.key === " ") {
        event.preventDefault();
        rotate();
      } else if (event.key === "Enter") {
        event.preventDefault();
        drop();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [drop, ended, menuOpen, phase, rotate]);

  return (
    <main className="game-page">
      <div ref={petalsRef} className="ambient-petals" aria-hidden="true">
        {Array.from({ length: 12 }, (_, index) => (
          <i key={index} style={{ left: `${8 + ((index * 37) % 84)}%` }} />
        ))}
      </div>
      <section className="game-layout" id="game">
        <div className="game-stage">
          <div className="game-board-wrap">
            <div className="canvas-frame">
              <GameCanvas
                ref={canvasRef}
                currentShape={currentShape}
                rotation={rotation}
                runId={runId}
                pieceId={pieceId}
                paused={menuOpen || ended}
                onLocked={handleLocked}
                onPieceMissed={handlePieceMissed}
                onGameOver={handleGameOver}
                onPhaseChange={setPhase}
              />
            </div>
            <GameHud score={score} lives={lives} />
          </div>
        </div>
      </section>

      {menuOpen && <GameMenu onClose={() => setMenuOpen(false)} onRetry={restart} />}
      {ended && (
        <GameOverOverlay
          score={score}
          bestScore={bestScore}
          showScore={showScore}
          onRetry={restart}
          onViewScore={() => setShowScore(true)}
        />
      )}
    </main>
  );
}
