"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GameCanvas, type GameCanvasHandle } from "./GameCanvas";
import { GameHud } from "./GameHud";
import { GameOverOverlay } from "./GameOverOverlay";
import { pickShape, POINTS_PER_PIECE, rotateQuarterTurn } from "@/game/rules";
import type { GamePhase, QuarterTurn, ShapeType } from "@/game/types";

export function LogoStackGame() {
  const canvasRef = useRef<GameCanvasHandle>(null);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<GamePhase>("aiming");
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
    setScore((value) => value + POINTS_PER_PIECE);
    setCurrentShape(nextShape);
    setNextShape(pickShape());
    setRotation(0);
    setPieceId((value) => value + 1);
    setPhase("aiming");
  }, [nextShape]);

  const handleGameOver = useCallback(() => setPhase("gameOver"), []);

  const restart = useCallback(() => {
    setScore(0);
    setPhase("aiming");
    setRotation(0);
    setCurrentShape(pickShape());
    setNextShape(pickShape());
    setPieceId(0);
    setRunId((value) => value + 1);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (phase !== "aiming") return;
      const key = event.key.toLowerCase();
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
  }, [drop, phase, rotate]);

  return (
    <main className="game-page">
      <section className="game-layout" id="game">
        <div className="game-board-wrap">
          <div className="hud-row">
            <GameHud score={score} nextShape={nextShape} phase={phase} onRotate={rotate} onDrop={drop} />
          </div>

          <div className="canvas-frame">
            <GameCanvas
              ref={canvasRef}
              currentShape={currentShape}
              rotation={rotation}
              runId={runId}
              pieceId={pieceId}
              onLocked={handleLocked}
              onGameOver={handleGameOver}
              onPhaseChange={setPhase}
            />
          </div>
        </div>

        <p className="instructions">Move with A / D or ← / → · Rotate with Space · Drop with Enter</p>
      </section>

      {phase === "gameOver" && <GameOverOverlay score={score} onRestart={restart} />}
    </main>
  );
}
