"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GameCanvas, type GameCanvasHandle } from "./GameCanvas";
import { GameHud } from "./GameHud";
import { GameMenu } from "./GameMenu";
import { GameOverOverlay } from "./GameOverOverlay";
import { pickShape, POINTS_PER_PIECE, rotateQuarterTurn } from "@/game/rules";
import { createLocalScoreStore, updateBestScore } from "@/game/scoreStore";
import type { GamePhase, QuarterTurn, ShapeType } from "@/game/types";

export function LogoStackGame() {
  const canvasRef = useRef<GameCanvasHandle>(null);
  const scoreStoreRef = useRef(createLocalScoreStore());
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [phase, setPhase] = useState<GamePhase>("aiming");
  const [menuOpen, setMenuOpen] = useState(false);
  const [ended, setEnded] = useState(false);
  const [showScore, setShowScore] = useState(false);
  const [clearing, setClearing] = useState(false);
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

  const handleLocked = useCallback(() => {
    setScore((value) => {
      const nextScore = value + POINTS_PER_PIECE;
      setBestScore((best) => updateBestScore(nextScore, best, scoreStoreRef.current));
      return nextScore;
    });
    setCurrentShape(nextShape);
    setNextShape(pickShape());
    setRotation(0);
    setPieceId((value) => value + 1);
    setPhase("aiming");
  }, [nextShape]);

  const endGame = useCallback(() => {
    setMenuOpen(false);
    setShowScore(false);
    setEnded(true);
    setPhase("gameOver");
  }, []);

  const handleGameOver = useCallback(() => endGame(), [endGame]);

  const restart = useCallback(() => {
    setScore(0);
    setPhase("aiming");
    setRotation(0);
    setCurrentShape(pickShape());
    setNextShape(pickShape());
    setPieceId(0);
    setMenuOpen(false);
    setEnded(false);
    setShowScore(false);
    setClearing(false);
    setRunId((value) => value + 1);
  }, []);

  const handleClearLineReached = useCallback(() => {
    setClearing(true);
    setPhase("clearing");
  }, []);

  useEffect(() => {
    if (!clearing) return;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => {
      canvasRef.current?.clearLockedPieces();
      setClearing(false);
      setPhase("aiming");
    }, reducedMotion ? 80 : 650);
    return () => window.clearTimeout(timer);
  }, [clearing]);

  useEffect(() => {
    setBestScore(scoreStoreRef.current.readBest());
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (event.key === "Escape" && !ended) {
        event.preventDefault();
        setMenuOpen((open) => !open);
        return;
      }
      if (key === "p" && process.env.NODE_ENV !== "production" && !menuOpen && !ended && !clearing) {
        event.preventDefault();
        handleClearLineReached();
        return;
      }
      if (menuOpen || ended || clearing) return;
      if (phase !== "aiming") return;
      if (key === "arrowleft" || key === "arrowright" || key === "a" || key === "d") {
        event.preventDefault();
        canvasRef.current?.moveBy(key === "arrowleft" || key === "a" ? -24 : 24);
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
  }, [clearing, drop, ended, handleClearLineReached, menuOpen, phase, rotate]);

  return (
    <main className="game-page">
      <section className="game-layout" id="game">
        <div className={`game-board-wrap${clearing ? " is-clearing" : ""}`}>
          <div className="hud-row">
            <GameHud
              score={score}
              bestScore={bestScore}
              nextShape={nextShape}
              phase={menuOpen || ended || clearing ? "gameOver" : phase}
              onRotate={rotate}
              onDrop={drop}
              onMenu={() => setMenuOpen(true)}
            />
          </div>

          <div className="canvas-frame">
            <GameCanvas
              ref={canvasRef}
              currentShape={currentShape}
              rotation={rotation}
              runId={runId}
              pieceId={pieceId}
              paused={menuOpen || ended || clearing}
              onClearLineReached={handleClearLineReached}
              onLocked={handleLocked}
              onGameOver={handleGameOver}
              onPhaseChange={setPhase}
            />
            {clearing && <div className="petal-burst" aria-hidden="true">{Array.from({ length: 14 }, (_, index) => <i key={index} />)}</div>}
          </div>
        </div>

        <p className="instructions">Desktop: A / D or ← / → move · Space rotates · Enter drops · Phone: swipe to move · tap to rotate · press Drop</p>
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
