"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from "react";
import {
  Bodies,
  Body,
  Composite,
  Engine,
  Events,
  Query,
  Sleeping,
  World,
  type IEventTimestamped
} from "matter-js";
import { createPieceBody, PIECE_STYLES } from "@/game/pieces";
import { dropPiece, INITIAL_GAME_STATE, lockPiece, updateSettlement } from "@/game/rules";
import type { GamePhase, GameState, QuarterTurn, ShapeType } from "@/game/types";

const WORLD_WIDTH = 900;
const WORLD_HEIGHT = 650;
const SPAWN_Y = 78;
const SPAWN_MIN_X = 70;
const SPAWN_MAX_X = 830;
const PLATFORM_Y = 555;
const FAILURE_Y = 690;
export const CLEAR_LINE_Y = 130;

export interface GameCanvasHandle {
  moveTo: (x: number) => void;
  moveBy: (delta: number) => void;
  rotate: () => void;
  drop: () => void;
  clearLockedPieces: () => void;
}

interface GameCanvasProps {
  currentShape: ShapeType;
  rotation: QuarterTurn;
  runId: number;
  pieceId?: number;
  onLocked: () => void;
  onGameOver: () => void;
  onReady?: () => void;
  onPhaseChange?: (phase: GamePhase) => void;
  paused?: boolean;
  onClearLineReached?: () => void;
}

interface SpriteSnapshot {
  id: number;
  type: ShapeType;
  x: number;
  y: number;
  angle: number;
  isActive: boolean;
}

export const GameCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(function GameCanvas(
  { currentShape, rotation, runId, pieceId = 0, onLocked, onGameOver, onReady, onPhaseChange, paused = false, onClearLineReached },
  ref
) {
  const shellRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const activeRef = useRef<Body | null>(null);
  const piecesRef = useRef<Body[]>([]);
  const phaseRef = useRef<GameState>({ ...INITIAL_GAME_STATE });
  const spawnXRef = useRef(WORLD_WIDTH / 2);
  const failedRef = useRef(false);
  const pausedRef = useRef(paused);
  const clearTriggeredRef = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const callbacksRef = useRef({ onLocked, onGameOver, onReady, onPhaseChange, onClearLineReached });
  const [sprites, setSprites] = useState<SpriteSnapshot[]>([]);

  useEffect(() => {
    callbacksRef.current = { onLocked, onGameOver, onReady, onPhaseChange, onClearLineReached };
  }, [onLocked, onGameOver, onReady, onPhaseChange, onClearLineReached]);

  useEffect(() => { pausedRef.current = paused; }, [paused]);

  const setPhase = useCallback((state: GameState) => {
    phaseRef.current = state;
    callbacksRef.current.onPhaseChange?.(state.phase);
  }, []);

  const syncSprites = useCallback(() => {
    setSprites(
      piecesRef.current.map((body) => ({
        id: body.id,
        type: body.plugin.shapeType as ShapeType,
        x: body.position.x,
        y: body.position.y,
        angle: body.angle,
        isActive: body === activeRef.current
      }))
    );
  }, []);

  const moveTo = useCallback((x: number) => {
    const body = activeRef.current;
    if (pausedRef.current || !body || phaseRef.current.phase !== "aiming") return;
    const nextX = Math.min(SPAWN_MAX_X, Math.max(SPAWN_MIN_X, x));
    spawnXRef.current = nextX;
    Body.setPosition(body, { x: nextX, y: SPAWN_Y });
    syncSprites();
  }, [syncSprites]);

  const rotate = useCallback(() => {
    const body = activeRef.current;
    if (pausedRef.current || !body || phaseRef.current.phase !== "aiming") return;
    Body.rotate(body, Math.PI / 2);
    syncSprites();
  }, [syncSprites]);

  const drop = useCallback(() => {
    const body = activeRef.current;
    if (pausedRef.current || !body || phaseRef.current.phase !== "aiming") return;
    setPhase(dropPiece(phaseRef.current));
    Body.setStatic(body, false);
    Sleeping.set(body, false);
    Body.setVelocity(body, { x: 0, y: 3 });
  }, [setPhase]);

  const clearLockedPieces = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const active = activeRef.current;
    const locked = piecesRef.current.filter((body) => body !== active);
    locked.forEach((body) => World.remove(engine.world, body));
    piecesRef.current = active ? [active] : [];
    clearTriggeredRef.current = false;
    syncSprites();
  }, [syncSprites]);

  useImperativeHandle(ref, () => ({
    moveTo,
    moveBy: (delta) => moveTo(spawnXRef.current + delta),
    rotate,
    drop,
    clearLockedPieces
  }), [clearLockedPieces, drop, moveTo, rotate]);

  useEffect(() => {
    const engine = Engine.create({ enableSleeping: true });
    engine.gravity.y = 1.05;
    const platform = Bodies.rectangle(WORLD_WIDTH / 2, PLATFORM_Y, 430, 30, {
      isStatic: true,
      label: "platform",
      friction: 1
    });

    World.add(engine.world, platform);
    engineRef.current = engine;
    activeRef.current = null;
    piecesRef.current = [];
    failedRef.current = false;
    spawnXRef.current = WORLD_WIDTH / 2;
    setSprites([]);
    setPhase({ ...INITIAL_GAME_STATE });

    const afterUpdate = (event: IEventTimestamped<Engine>) => {
      const active = activeRef.current;
      if (!active || failedRef.current) return;

      if (piecesRef.current.some((body) => body.position.y > FAILURE_Y)) {
        failedRef.current = true;
        setPhase({ ...phaseRef.current, phase: "gameOver", settleStartedAt: null });
        callbacksRef.current.onGameOver();
        return;
      }

      if (phaseRef.current.phase === "falling" || phaseRef.current.phase === "settling") {
        const supports = [platform, ...piecesRef.current.filter((body) => body !== active)];
        const next = updateSettlement(
          phaseRef.current,
          Query.collides(active, supports).length > 0,
          active.speed,
          active.angularSpeed,
          event.timestamp
        );
        setPhase(next);

        if (next.phase === "locked") {
          Body.setStatic(active, true);
          setPhase(lockPiece(next));
          activeRef.current = null;
          syncSprites();
          callbacksRef.current.onLocked();
          if (!clearTriggeredRef.current && piecesRef.current.some((body) => body.bounds.min.y <= CLEAR_LINE_Y)) {
            clearTriggeredRef.current = true;
            callbacksRef.current.onClearLineReached?.();
          }
        }
      }
    };

    Events.on(engine, "afterUpdate", afterUpdate);
    const physicsTimer = window.setInterval(() => {
      if (!pausedRef.current) Engine.update(engine, 1000 / 60);
      syncSprites();
    }, 1000 / 60);
    callbacksRef.current.onReady?.();

    return () => {
      window.clearInterval(physicsTimer);
      Events.off(engine, "afterUpdate", afterUpdate);
      Composite.clear(engine.world, false, true);
      Engine.clear(engine);
      engineRef.current = null;
      activeRef.current = null;
      piecesRef.current = [];
    };
  }, [runId, setPhase, syncSprites]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || activeRef.current || failedRef.current) return;

    const body = createPieceBody(currentShape, spawnXRef.current, SPAWN_Y, rotation);
    Body.setStatic(body, true);
    activeRef.current = body;
    piecesRef.current.push(body);
    World.add(engine.world, body);
    setPhase({ ...phaseRef.current, phase: "aiming", rotation, settleStartedAt: null });
    syncSprites();
  }, [currentShape, pieceId, rotation, runId, setPhase, syncSprites]);

  useEffect(() => {
    const body = activeRef.current;
    if (!body || phaseRef.current.phase !== "aiming") return;
    Body.setAngle(body, rotation * (Math.PI / 2));
    phaseRef.current = { ...phaseRef.current, rotation };
    syncSprites();
  }, [rotation, syncSprites]);

  return (
    <div
      ref={shellRef}
      className="game-canvas-shell"
      role="application"
      aria-label="Logo Stack playfield"
      data-phase={phaseRef.current.phase}
      data-paused={paused}
      onPointerDown={(event) => {
        if (event.pointerType === "touch") touchStartRef.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerUp={(event) => {
        const start = touchStartRef.current;
        touchStartRef.current = null;
        if (event.pointerType !== "touch" || !start || pausedRef.current) return;
        const deltaX = event.clientX - start.x;
        const deltaY = event.clientY - start.y;
        if (Math.abs(deltaX) >= 30 && Math.abs(deltaX) > Math.abs(deltaY)) {
          moveTo(spawnXRef.current + Math.sign(deltaX) * 72);
        } else if (Math.hypot(deltaX, deltaY) < 18) {
          rotate();
        }
      }}
    >
      <div className="clear-line" aria-hidden="true" />
      <div className="pieces-layer">
        {sprites.map((sprite) => (
          <img
            key={sprite.id}
            src={`/assets/${sprite.type === "logo" ? "c2c-logo" : "blossom"}.svg`}
            alt={sprite.isActive ? `Current ${sprite.type} piece` : ""}
            className="physics-piece"
            style={{
              left: `${(sprite.x / WORLD_WIDTH) * 100}%`,
              top: `${(sprite.y / WORLD_HEIGHT) * 100}%`,
              width: `${((PIECE_STYLES[sprite.type].size * 2.25) / WORLD_WIDTH) * 100}%`,
              transform: `translate(-50%, -50%) rotate(${sprite.angle}rad)`
            }}
          />
        ))}
      </div>
      <div className="platform-visual" data-testid="platform" aria-hidden="true" />
    </div>
  );
});
