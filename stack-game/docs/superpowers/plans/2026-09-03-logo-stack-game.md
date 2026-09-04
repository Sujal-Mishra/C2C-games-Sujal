# Logo Stack Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a responsive cherry-blossom-themed stacking game in which players position, rotate, and drop three physics-driven placeholder logo shapes.

**Architecture:** A Next.js page owns presentation and run-level UI while a focused React canvas component integrates Matter.js. Pure TypeScript modules define the state transitions, settling rules, scoring, coordinate clamping, and piece metadata so the core behavior can be tested without a browser physics renderer.

**Tech Stack:** Next.js, React, TypeScript, Matter.js, Vitest, Testing Library, CSS Modules/global CSS

**Spec:** `docs/superpowers/specs/2026-09-03-logo-stack-game-design.md`

## Global Constraints

- Do not commit implementation or planning changes; leave all new work uncommitted per the user's instruction.
- Use exactly three placeholder types: `circle`, `diamond`, and `hexagon`.
- Rotation has four states in 90-degree increments.
- Award exactly 100 points only after a piece locks.
- Locked pieces must become immovable.
- Restart must clear all pieces and set the score to zero.
- Support mouse, keyboard, and touch input.
- Respect `prefers-reduced-motion` for decorative petal animation.
- Keep the game fully client-side with no account, persistence, networking, or backend.

## Planned File Structure

- `package.json`: Next.js scripts and runtime/test dependencies.
- `tsconfig.json`, `next.config.ts`, `next-env.d.ts`: TypeScript and Next.js setup.
- `vitest.config.ts`, `vitest.setup.ts`: unit and component test setup.
- `app/layout.tsx`: root metadata and document shell.
- `app/page.tsx`: game page entry point.
- `app/globals.css`: responsive cherry-blossom presentation, controls, scenery, and reduced-motion handling.
- `components/LogoStackGame.tsx`: run lifecycle, score/UI state, and game-level controls.
- `components/GameCanvas.tsx`: Matter.js world, rendering, input mapping, settlement observation, and cleanup.
- `components/GameHud.tsx`: semantic score, next-piece preview, hints, and touch actions.
- `components/GameOverOverlay.tsx`: final score and restart action.
- `game/types.ts`: shared state, shape, and event types.
- `game/rules.ts`: pure state transitions, clamping, rotation, settling, scoring, and failure rules.
- `game/pieces.ts`: piece metadata and Matter.js body factory.
- `game/rules.test.ts`: deterministic rule tests.
- `components/LogoStackGame.test.tsx`: user-visible lifecycle and control tests.

---

### Task 1: Scaffold the Next.js App and Test Harness

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `next-env.d.ts`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`
- Test: `app/page.test.tsx`

**Interfaces:**
- Produces: a Next.js App Router shell and Vitest environment used by all later tasks.
- Consumes: no earlier task interfaces.

- [ ] **Step 1: Create the package manifest and configuration**

Create scripts for `dev`, `build`, `start`, `lint`, and `test`. Add `next`, `react`, `react-dom`, `matter-js`, and matching type packages, plus Vitest, jsdom, and Testing Library development dependencies. Configure Vitest for `jsdom`, `vitest.setup.ts`, and the `@/*` alias.

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: { environment: "jsdom", setupFiles: ["./vitest.setup.ts"] },
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
});
```

- [ ] **Step 2: Write the failing page smoke test**

```tsx
// app/page.test.tsx
import { render, screen } from "@testing-library/react";
import Page from "./page";

test("renders the Logo Stack game heading", () => {
  render(<Page />);
  expect(screen.getByRole("heading", { name: /logo stack/i })).toBeVisible();
});
```

- [ ] **Step 3: Run the smoke test and verify RED**

Run: `npm test -- app/page.test.tsx`

Expected: FAIL because `app/page.tsx` does not yet export the game page.

- [ ] **Step 4: Implement the minimal app shell**

```tsx
// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Logo Stack | Code2Create",
  description: "A cherry-blossom physics stacking game.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
```

```tsx
// app/page.tsx
export default function Page() {
  return <main><h1>Logo Stack</h1></main>;
}
```

- [ ] **Step 5: Verify the scaffold**

Run: `npm test -- app/page.test.tsx`

Expected: PASS with one passing test.

Run: `npm run build`

Expected: exit code 0 with a statically generated `/` route.

### Task 2: Implement Deterministic Game Rules

**Files:**
- Create: `game/types.ts`
- Create: `game/rules.ts`
- Test: `game/rules.test.ts`

**Interfaces:**
- Produces: `ShapeType`, `GamePhase`, `GameState`, `rotateQuarterTurn`, `clampSpawnX`, `dropPiece`, `updateSettlement`, `lockPiece`, `detectFailure`, `restartGame`, and `pickShape`.
- Consumes: no earlier game interfaces.

- [ ] **Step 1: Define shared types and write failing rotation/clamping tests**

```ts
// game/types.ts
export type ShapeType = "circle" | "diamond" | "hexagon";
export type GamePhase = "aiming" | "falling" | "settling" | "locked" | "gameOver";
export type QuarterTurn = 0 | 1 | 2 | 3;

export interface GameState {
  phase: GamePhase;
  score: number;
  rotation: QuarterTurn;
  settleStartedAt: number | null;
}
```

```ts
// game/rules.test.ts
import { describe, expect, test } from "vitest";
import { clampSpawnX, rotateQuarterTurn } from "./rules";

describe("aiming rules", () => {
  test("rotation wraps after four quarter turns", () => {
    expect([0, 1, 2, 3].reduce((turn) => rotateQuarterTurn(turn), 0)).toBe(0);
  });

  test("spawn position stays inside the playable range", () => {
    expect(clampSpawnX(-20, 80, 720)).toBe(80);
    expect(clampSpawnX(900, 80, 720)).toBe(720);
  });
});
```

- [ ] **Step 2: Run the rule tests and verify RED**

Run: `npm test -- game/rules.test.ts`

Expected: FAIL because `game/rules.ts` does not exist.

- [ ] **Step 3: Implement rotation and clamping minimally**

```ts
export function rotateQuarterTurn(turn: QuarterTurn): QuarterTurn {
  return ((turn + 1) % 4) as QuarterTurn;
}

export function clampSpawnX(x: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, x));
}
```

- [ ] **Step 4: Run the rule tests and verify GREEN**

Run: `npm test -- game/rules.test.ts`

Expected: PASS.

- [ ] **Step 5: Add failing lifecycle, scoring, failure, restart, and selection tests**

Add tests proving that only `aiming` can drop, renewed motion clears the settling timer, one second of low motion locks, locking adds 100 points once, crossing the failure boundary enters `gameOver`, restart returns the initial state, and `pickShape` only returns a supported shape for random values `0`, `0.5`, and `0.99`.

```ts
const initial: GameState = { phase: "aiming", score: 0, rotation: 0, settleStartedAt: null };

test("a stable piece locks after one second and awards 100 points", () => {
  const settling = updateSettlement({ ...initial, phase: "falling" }, true, 0.01, 0.01, 100);
  const locked = updateSettlement(settling, true, 0.01, 0.01, 1100);
  expect(lockPiece(locked)).toMatchObject({ phase: "locked", score: 100 });
});
```

- [ ] **Step 6: Run the expanded tests and verify RED**

Run: `npm test -- game/rules.test.ts`

Expected: FAIL with missing lifecycle rule exports.

- [ ] **Step 7: Implement the complete pure rule API**

Use constants `SETTLE_MS = 1000`, `LINEAR_SPEED_LIMIT = 0.18`, `ANGULAR_SPEED_LIMIT = 0.02`, and `POINTS_PER_PIECE = 100`. Keep each state transition immutable. `detectFailure` must return `gameOver` when any body center is below the supplied boundary. `restartGame` must return a new initial state. `pickShape(random)` must map three equal ranges to the supported shapes.

- [ ] **Step 8: Verify all deterministic rules**

Run: `npm test -- game/rules.test.ts`

Expected: all rule tests PASS.

### Task 3: Create Piece Metadata and Physics Bodies

**Files:**
- Create: `game/pieces.ts`
- Test: `game/pieces.test.ts`

**Interfaces:**
- Consumes: `ShapeType` and `QuarterTurn` from `game/types.ts`.
- Produces: `PIECE_STYLES: Record<ShapeType, PieceStyle>` and `createPieceBody(type: ShapeType, x: number, y: number, turn: QuarterTurn): Matter.Body`.

- [ ] **Step 1: Write failing factory tests**

Test real Matter.js bodies. Assert that the circle has a circular label and radius, the diamond body starts at 45 degrees plus its quarter turn, the hexagon has six vertices, and every body uses the tuned arcade settings.

```ts
test("diamond combines its base angle with quarter-turn rotation", () => {
  const body = createPieceBody("diamond", 100, 40, 1);
  expect(body.angle).toBeCloseTo(Math.PI * 0.75);
});
```

- [ ] **Step 2: Run factory tests and verify RED**

Run: `npm test -- game/pieces.test.ts`

Expected: FAIL because the factory is missing.

- [ ] **Step 3: Implement the piece factory**

Build circle, square, and six-sided polygon bodies with consistent visual footprint. Apply `friction: 0.85`, `frictionStatic: 1`, `restitution: 0.08`, `frictionAir: 0.018`, and shape-specific density. Assign `plugin.shapeType`, readable labels, pink fill colors, and pale outlines through Matter render options.

- [ ] **Step 4: Verify the factory**

Run: `npm test -- game/pieces.test.ts`

Expected: all factory tests PASS.

### Task 4: Build the Matter.js Canvas

**Files:**
- Create: `components/GameCanvas.tsx`
- Test: `components/GameCanvas.test.tsx`

**Interfaces:**
- Consumes: `ShapeType`, `QuarterTurn`, rule functions, and `createPieceBody`.
- Produces: `GameCanvas({ currentShape, rotation, runId, onLocked, onGameOver, onReady }, ref)` with imperative methods `moveTo(x)`, `moveBy(delta)`, `rotate()`, and `drop()`.

- [ ] **Step 1: Write a failing lifecycle test**

Mock only the animation/renderer boundary, not the pure rules. Render the canvas and assert it exposes an accessible game-region label and calls `onReady` after world creation.

```tsx
render(<GameCanvas currentShape="circle" rotation={0} runId={0} onLocked={vi.fn()} onGameOver={vi.fn()} onReady={onReady} />);
expect(screen.getByRole("application", { name: /logo stack playfield/i })).toBeVisible();
expect(onReady).toHaveBeenCalledOnce();
```

- [ ] **Step 2: Run the component test and verify RED**

Run: `npm test -- components/GameCanvas.test.tsx`

Expected: FAIL because `GameCanvas` is missing.

- [ ] **Step 3: Implement world creation and cleanup**

Create an engine with gravity, a transparent responsive renderer, a fixed platform, side scenery bodies that do not interfere with play, a runner, a `ResizeObserver`, and an effect cleanup that stops the runner/render loop and removes all Matter event listeners and bodies.

- [ ] **Step 4: Implement aiming and drop behavior**

Render the active preview body as static above the world. Clamp pointer coordinates. Apply quarter-turn rotation without cumulative floating-point drift. On drop, enable dynamics and ignore further aiming input until the piece resolves.

- [ ] **Step 5: Implement settling, locking, and failure observation**

On engine updates, determine whether the active piece is touching the platform or another piece, pass its speeds and timestamp through `updateSettlement`, and call `Body.setStatic(body, true)` once locked. Call `onLocked()` exactly once. Check every placed body against a failure boundary below the platform and call `onGameOver()` exactly once.

- [ ] **Step 6: Verify canvas behavior and cleanup**

Run: `npm test -- components/GameCanvas.test.tsx`

Expected: all canvas lifecycle tests PASS with no unhandled timers or event-listener warnings.

### Task 5: Build the HUD and Game Lifecycle UI

**Files:**
- Create: `components/GameHud.tsx`
- Create: `components/GameOverOverlay.tsx`
- Create: `components/LogoStackGame.tsx`
- Modify: `app/page.tsx`
- Test: `components/LogoStackGame.test.tsx`

**Interfaces:**
- Consumes: `GameCanvas` imperative interface and `ShapeType`.
- Produces: the complete playable `<LogoStackGame />` page experience.

- [ ] **Step 1: Write failing user-flow tests**

Test the visible score, rotate/drop buttons, next-piece label, disabled controls while falling, one 100-point increment for a lock event, game-over overlay, and restart resetting the displayed score to zero. Stub `GameCanvas` at its component boundary to emit explicit lock and failure events.

```tsx
test("restart clears the score after game over", async () => {
  render(<LogoStackGame />);
  await userEvent.click(screen.getByRole("button", { name: /drop/i }));
  fireEvent(window, new CustomEvent("test-piece-locked"));
  expect(screen.getByText("100")).toBeVisible();
  fireEvent(window, new CustomEvent("test-game-over"));
  await userEvent.click(screen.getByRole("button", { name: /play again/i }));
  expect(screen.getByText("0")).toBeVisible();
});
```

- [ ] **Step 2: Run the UI tests and verify RED**

Run: `npm test -- components/LogoStackGame.test.tsx`

Expected: FAIL because the game UI components are missing.

- [ ] **Step 3: Implement semantic HUD and overlay components**

Use a live score output, an SVG/CSS next-piece preview, explicit Rotate and Drop buttons, responsive input hints, a focus-trapped game-over dialog, final-score copy, and a Play Again button.

- [ ] **Step 4: Implement the game-level controller**

Keep `score`, `phase`, `currentShape`, `nextShape`, and `runId` in React state. Forward keyboard actions only during `aiming`. On lock, add exactly 100 points, promote `nextShape`, choose another random supported shape, and create the next piece. On failure, preserve the final score for the overlay; on restart, set score to zero, clear the overlay, and increment `runId` so the physics world is recreated.

- [ ] **Step 5: Connect the page and verify UI behavior**

Replace the smoke-test heading page with `<LogoStackGame />`, then run:

`npm test -- app/page.test.tsx components/LogoStackGame.test.tsx`

Expected: all page and game UI tests PASS.

### Task 6: Apply the Cherry-Blossom Theme and Responsive Interaction

**Files:**
- Modify: `app/globals.css`
- Modify: `components/LogoStackGame.tsx`
- Modify: `components/GameHud.tsx`
- Test: `components/LogoStackGame.test.tsx`

**Interfaces:**
- Consumes: the complete UI from Task 5.
- Produces: final responsive visuals and accessibility behavior.

- [ ] **Step 1: Add a failing accessibility assertion**

Assert that decorative petals are hidden from assistive technology, the score uses an accessible label, both control buttons have visible focusable names, and the game-over status uses `role="dialog"` with an accessible name.

- [ ] **Step 2: Run the accessibility assertions and verify RED**

Run: `npm test -- components/LogoStackGame.test.tsx`

Expected: FAIL on the newly required accessible structure.

- [ ] **Step 3: Implement the themed presentation**

Define CSS variables for near-black burgundy, blossom pink, pale pink, white, and dark green. Add layered radial gradients, a mountain/land silhouette, outlined glass panels, responsive type, a centered raised platform presentation, subtle glow, and 12 decorative petal elements with varied CSS custom properties.

- [ ] **Step 4: Implement responsive and reduced-motion rules**

At narrow widths, stack the HUD compactly, keep touch targets at least 44px, prevent touch scrolling only on the playfield, and shorten instructions. Under `@media (prefers-reduced-motion: reduce)`, remove petal animation and nonessential transitions.

- [ ] **Step 5: Verify accessibility and responsive code paths**

Run: `npm test -- components/LogoStackGame.test.tsx`

Expected: all UI tests PASS.

### Task 7: Full Verification and Manual Play Check

**Files:**
- Modify only files implicated by a verified failure.

**Interfaces:**
- Consumes: all prior tasks.
- Produces: a verified production-ready game without committing changes.

- [ ] **Step 1: Run the complete automated test suite**

Run: `npm test -- --run`

Expected: all tests PASS with zero unhandled errors or warnings.

- [ ] **Step 2: Run static and production checks**

Run: `npm run lint`

Expected: exit code 0.

Run: `npm run build`

Expected: exit code 0 and a successful `/` production route.

- [ ] **Step 3: Start the local development server and inspect desktop play**

Run: `npm run dev`

At a desktop viewport, verify mouse positioning, arrow-key positioning, all rotation controls, drop controls, natural collisions, one-second locking, 100-point increments, stack stability, failure detection, and score-zero restart.

- [ ] **Step 4: Inspect a mobile viewport**

At approximately 390×844, verify horizontal dragging, Rotate and Drop buttons, 44px touch targets, no page scroll caused inside the playfield, readable score/next preview, and an unobscured game-over dialog.

- [ ] **Step 5: Verify reduced motion and repository state**

Emulate reduced motion and confirm petals do not animate. Run `git status --short` and confirm all implementation/plan changes remain uncommitted as requested, with no unrelated file modifications.
