"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { GameCanvas, type GameCanvasHandle } from "./GameCanvas";
import { GameHud } from "./GameHud";
import { GameMenu } from "./GameMenu";
import { GameOverOverlay } from "./GameOverOverlay";
import { useGameAudio } from "./useGameAudio";
import {
  AIM_MOVE_STEP,
  drawShapeFromBag,
  INITIAL_LIVES,
  loseLife,
  POINTS_PER_PIECE,
  rotateQuarterTurn
} from "@/game/rules";
import { createLocalScoreStore, updateBestScore } from "@/game/scoreStore";
import type { GamePhase, QuarterTurn, ShapeType } from "@/game/types";

export function LogoStackGame() {
  const audio = useGameAudio();
  const canvasRef = useRef<GameCanvasHandle>(null);
  const petalsRef = useRef<HTMLDivElement>(null);
  const scoreStoreRef = useRef(createLocalScoreStore());
  const livesRef = useRef(INITIAL_LIVES);
  const shapeBagRef = useRef<ShapeType[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [bestScore, setBestScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [phase, setPhase] = useState<GamePhase>("aiming");
  const [menuOpen, setMenuOpen] = useState(false);
  const [introOpen, setIntroOpen] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [lostLifeIndex, setLostLifeIndex] = useState<number | null>(null);
  const [ended, setEnded] = useState(false);
  const [rotation, setRotation] = useState<QuarterTurn>(0);
  const [currentShape, setCurrentShape] = useState<ShapeType>("logo");
  const [nextShape, setNextShape] = useState<ShapeType>("petal");
  const [runId, setRunId] = useState(0);
  const [pieceId, setPieceId] = useState(0);

  const drawNextShape = useCallback(() => {
    const draw = drawShapeFromBag(shapeBagRef.current);
    shapeBagRef.current = draw.bag;
    return draw.shape;
  }, []);

  const rotate = useCallback(() => {
    if (phase !== "aiming") return;
    canvasRef.current?.rotate();
    setRotation((turn) => rotateQuarterTurn(turn));
  }, [phase]);

  const drop = useCallback(() => {
    if (phase !== "aiming") return;
    audio.playDrop();
    canvasRef.current?.drop();
    setPhase("falling");
  }, [audio, phase]);

  const startNextPiece = useCallback(() => {
    setCurrentShape(nextShape);
    setNextShape(drawNextShape());
    setRotation(0);
    setPieceId((value) => value + 1);
    setPhase("aiming");
  }, [drawNextShape, nextShape]);

  const handleLocked = useCallback(() => {
    audio.playLock();
    setTotalScore((total) => total + POINTS_PER_PIECE);
    setScore((value) => {
      const nextScore = value + POINTS_PER_PIECE;
      setBestScore((best) => updateBestScore(nextScore, best, scoreStoreRef.current));
      return nextScore;
    });
    startNextPiece();
  }, [audio, startNextPiece]);

  const startFreshLife = useCallback(() => {
    setScore(0);
    setPhase("aiming");
    setRotation(0);
    setCurrentShape(drawNextShape());
    setNextShape(drawNextShape());
    setPieceId(0);
    setRunId((value) => value + 1);
  }, []);

  const handlePieceMissed = useCallback(() => {
    audio.playLifeLost();
    const remainingLives = loseLife(livesRef.current);
    livesRef.current = remainingLives;
    setLives(remainingLives);
    setLostLifeIndex(remainingLives);
    return true;
  }, [audio, drawNextShape]);

  const endGame = useCallback(() => {
    audio.stopMusic();
    setMenuOpen(false);
    setLostLifeIndex(null);
    setEnded(true);
    setPhase("gameOver");
  }, [audio]);

  const handleGameOver = useCallback(() => endGame(), [endGame]);

  useEffect(() => {
    if (lostLifeIndex === null) return;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => {
      setLostLifeIndex(null);
      if (livesRef.current > 0) startFreshLife();
      else endGame();
    }, reducedMotion ? 80 : 650);
    return () => window.clearTimeout(timer);
  }, [endGame, lostLifeIndex, startFreshLife]);

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
      if (event.key === "Escape" && !ended && hasStarted && lostLifeIndex === null) {
        event.preventDefault();
        setMenuOpen((open) => !open);
        return;
      }
      if (!hasStarted || menuOpen || ended || lostLifeIndex !== null) return;
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
  }, [drop, ended, hasStarted, lostLifeIndex, menuOpen, phase, rotate]);

  return (
    <main className="game-page">
      <div ref={petalsRef} className="ambient-petals" aria-hidden="true">
        {Array.from({ length: 12 }, (_, index) => (
          <i key={index} style={{ left: `${8 + ((index * 37) % 84)}%` }} />
        ))}
      </div>
      <section className="game-layout" id="game">
        <button type="button" className="icon-button game-menu-button" aria-label="Open menu" onClick={() => setMenuOpen(true)}>☰</button>
        <div className="game-stage">
          <div className="game-board-wrap">
            <div className="canvas-frame">
              <GameCanvas
                ref={canvasRef}
                currentShape={currentShape}
                rotation={rotation}
                runId={runId}
                pieceId={pieceId}
                paused={!hasStarted || menuOpen || ended || lostLifeIndex !== null}
                onLocked={handleLocked}
                onPieceMissed={handlePieceMissed}
                onGameOver={handleGameOver}
                onPhaseChange={setPhase}
              />
              <GameHud score={score} totalScore={totalScore} lives={lives} lostLifeIndex={lostLifeIndex} />
              <button type="button" className="action-button mobile-drop-button" onClick={drop} disabled={phase !== "aiming" || !hasStarted || menuOpen || lostLifeIndex !== null}>Drop</button>
            </div>
          </div>
        </div>
      </section>

      {introOpen && (
        <div className="overlay-backdrop intro-overlay">
          <button type="button" className="play-button" aria-label="Play" onClick={() => { setIntroOpen(false); setMenuOpen(true); }}><span className="play-triangle" aria-hidden="true" /></button>
        </div>
      )}
      {menuOpen && (
        <GameMenu
          onClose={() => { setMenuOpen(false); if (!hasStarted) setIntroOpen(true); }}
          onContinue={() => { audio.startMusic(); setHasStarted(true); setIntroOpen(false); setMenuOpen(false); }}
        />
      )}
      {ended && (
        <GameOverOverlay totalScore={totalScore} />
      )}
    </main>
  );
}
