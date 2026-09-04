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
import { getPieceVisualPosition, setPieceVisualPosition } from "@/game/physics";
import {
  AIM_MOVE_STEP,
  dropPiece,
  getEndlessCameraTargetY,
  hasPieceMissed,
  INITIAL_GAME_STATE,
  lockPiece,
  updateSettlement
} from "@/game/rules";
import type { GamePhase, GameState, QuarterTurn, ShapeType } from "@/game/types";

const WORLD_WIDTH = 900;
const WORLD_HEIGHT = 650;
const SPAWN_SCREEN_Y = 78;
const SPAWN_MIN_X = 70;
const SPAWN_MAX_X = 830;
const PLATFORM_Y = 555;
const FAILURE_SCREEN_Y = WORLD_HEIGHT + 40;
const CAMERA_SCROLL_STEP = 4;

export interface GameCanvasHandle {
  moveTo: (x: number) => void;
  moveBy: (delta: number) => void;
  rotate: () => void;
  drop: () => void;
}

interface GameCanvasProps {
  currentShape: ShapeType;
  rotation: QuarterTurn;
  runId: number;
  pieceId?: number;
  onLocked: () => void;
  onPieceMissed: () => boolean;
  onGameOver: () => void;
  onReady?: () => void;
  onPhaseChange?: (phase: GamePhase) => void;
  paused?: boolean;
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
  { currentShape, rotation, runId, pieceId = 0, onLocked, onPieceMissed, onGameOver, onReady, onPhaseChange, paused = false },
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
  const cameraYRef = useRef(0);
  const cameraTargetYRef = useRef(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const callbacksRef = useRef({ onLocked, onPieceMissed, onGameOver, onReady, onPhaseChange });
  const [sprites, setSprites] = useState<SpriteSnapshot[]>([]);
  const [cameraY, setCameraY] = useState(0);

  useEffect(() => {
    callbacksRef.current = { onLocked, onPieceMissed, onGameOver, onReady, onPhaseChange };
  }, [onLocked, onPieceMissed, onGameOver, onReady, onPhaseChange]);

  useEffect(() => { pausedRef.current = paused; }, [paused]);

  const setPhase = useCallback((state: GameState) => {
    phaseRef.current = state;
    callbacksRef.current.onPhaseChange?.(state.phase);
  }, []);

  const syncSprites = useCallback(() => {
    setCameraY(cameraYRef.current);
    setSprites(
      piecesRef.current.map((body) => {
        const visualPosition = getPieceVisualPosition(body);
        return {
          id: body.id,
          type: body.plugin.shapeType as ShapeType,
          x: visualPosition.x,
          y: visualPosition.y,
          angle: body.angle,
          isActive: body === activeRef.current
        };
      })
    );
  }, []);

  const moveTo = useCallback((x: number) => {
    const body = activeRef.current;
    if (pausedRef.current || !body || phaseRef.current.phase !== "aiming") return;
    const nextX = Math.min(SPAWN_MAX_X, Math.max(SPAWN_MIN_X, x));
    spawnXRef.current = nextX;
    setPieceVisualPosition(body, nextX, cameraYRef.current + SPAWN_SCREEN_Y);
    syncSprites();
  }, [syncSprites]);

  const rotate = useCallback(() => {
    const body = activeRef.current;
    if (pausedRef.current || !body || phaseRef.current.phase !== "aiming") return;
    const visualPosition = getPieceVisualPosition(body);
    Body.rotate(body, Math.PI / 2);
    setPieceVisualPosition(body, visualPosition.x, visualPosition.y);
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

  useImperativeHandle(ref, () => ({
    moveTo,
    moveBy: (delta) => moveTo(spawnXRef.current + delta),
    rotate,
    drop
  }), [drop, moveTo, rotate]);

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
    cameraYRef.current = 0;
    cameraTargetYRef.current = 0;
    setCameraY(0);
    setSprites([]);
    setPhase({ ...INITIAL_GAME_STATE });

    const afterUpdate = (event: IEventTimestamped<Engine>) => {
      const active = activeRef.current;
      if (!active || failedRef.current) return;

      if (
        (phaseRef.current.phase === "falling" || phaseRef.current.phase === "settling") &&
        hasPieceMissed(active.position.y, cameraYRef.current + FAILURE_SCREEN_Y)
      ) {
        World.remove(engine.world, active);
        piecesRef.current = piecesRef.current.filter((body) => body !== active);
        activeRef.current = null;
        const canContinue = callbacksRef.current.onPieceMissed();
        if (canContinue) {
          setPhase({ ...phaseRef.current, phase: "locked", settleStartedAt: null });
        } else {
          failedRef.current = true;
          setPhase({ ...phaseRef.current, phase: "gameOver", settleStartedAt: null });
          callbacksRef.current.onGameOver();
        }
        syncSprites();
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
          Sleeping.set(active, true);
          setPhase(lockPiece(next));
          const stackTopY = Math.min(...piecesRef.current.map((body) => body.bounds.min.y));
          cameraTargetYRef.current = getEndlessCameraTargetY(
            cameraTargetYRef.current,
            stackTopY,
            WORLD_HEIGHT
          );
          activeRef.current = null;
          syncSprites();
          callbacksRef.current.onLocked();
        }
      }
    };

    Events.on(engine, "afterUpdate", afterUpdate);
    const physicsTimer = window.setInterval(() => {
      if (!pausedRef.current) {
        if (cameraYRef.current > cameraTargetYRef.current) {
          cameraYRef.current = Math.max(
            cameraTargetYRef.current,
            cameraYRef.current - CAMERA_SCROLL_STEP
          );
          const active = activeRef.current;
          if (active && phaseRef.current.phase === "aiming") {
            setPieceVisualPosition(
              active,
              spawnXRef.current,
              cameraYRef.current + SPAWN_SCREEN_Y
            );
          }
        }
        Engine.update(engine, 1000 / 60);
      }
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

    const body = createPieceBody(
      currentShape,
      spawnXRef.current,
      cameraYRef.current + SPAWN_SCREEN_Y,
      rotation
    );
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
    const visualPosition = getPieceVisualPosition(body);
    Body.setAngle(body, rotation * (Math.PI / 2));
    setPieceVisualPosition(body, visualPosition.x, visualPosition.y);
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
        if (deltaY >= 40 && Math.abs(deltaY) > Math.abs(deltaX)) {
          drop();
        } else if (Math.abs(deltaX) >= 30 && Math.abs(deltaX) > Math.abs(deltaY)) {
          moveTo(spawnXRef.current + Math.sign(deltaX) * AIM_MOVE_STEP);
        } else if (Math.hypot(deltaX, deltaY) < 18) {
          rotate();
        }
      }}
    >
      <div className="pieces-layer">
        {sprites.map((sprite) => (
          <img
            key={sprite.id}
            data-piece-id={sprite.id}
            src={`/assets/${sprite.type === "logo" ? "c2c-logo" : sprite.type}.svg`}
            alt={sprite.isActive ? `Current ${sprite.type} piece` : ""}
            className="physics-piece"
            style={{
              left: `${(sprite.x / WORLD_WIDTH) * 100}%`,
              top: `${((sprite.y - cameraY) / WORLD_HEIGHT) * 100}%`,
              width: `${(PIECE_STYLES[sprite.type].renderWidth / WORLD_WIDTH) * 100}%`,
              transform: `translate(-50%, -50%) rotate(${sprite.angle}rad)`
            }}
          />
        ))}
      </div>
      <div
        className="platform-visual"
        data-testid="platform"
        aria-hidden="true"
        style={{ top: `${((PLATFORM_Y - cameraY) / WORLD_HEIGHT) * 100}%` }}
      />
    </div>
  );
});
