# Stack Progression and Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add endless height-line clearing, persistent personal-best scoring, pause/help controls, and a minimal end screen to the existing logo stacking game.

**Architecture:** Keep Matter.js responsible for bodies and collision while React owns menu, score, clearing, and end-screen state. Isolate best-score persistence behind a synchronous `ScoreStore` interface so a later API-backed leaderboard can replace local storage without changing the game controller.

**Tech Stack:** Next.js 16, React 19, TypeScript, Matter.js, Vitest, Testing Library, browser localStorage

**Spec:** `docs/superpowers/specs/2026-09-03-stack-progression-menu-design.md`

## Global Constraints

- Preserve A/D and Left/Right movement, Space rotation, and Enter drop.
- Ignore gameplay input while paused, clearing, or ended.
- Use black borders throughout the game interface.
- Keep the page background solid near-black and the inner game container ombré.
- Award 100 points per locked piece and preserve current score across stack clears.
- Retry resets current score only; personal best persists.
- Keep score storage replaceable and tolerate localStorage failures.
- Keep visuals simple; add no title, scenery, or decorative page background.

## File Structure

- `game/scoreStore.ts`: storage interface and localStorage implementation.
- `game/scoreStore.test.ts`: persistence, validation, and failure tests.
- `components/GameMenu.tsx`: pause/help/shortcut/end-game menu.
- `components/GameMenu.test.tsx`: menu semantics and action tests.
- `components/GameCanvas.tsx`: pause-aware engine loop, clear-line detection, and stack clearing.
- `components/GameCanvas.test.tsx`: canvas API and height-clear tests.
- `components/LogoStackGame.tsx`: UI state, scores, menu, clearing sequence, and end actions.
- `components/LogoStackGame.test.tsx`: controller-level menu, score, and end-screen tests.
- `components/LogoStackGame.e2e.test.tsx`: real physics regression for pause and clear/resume.
- `components/GameHud.tsx`: current/best score and menu button.
- `components/GameOverOverlay.tsx`: Retry, End Game, View Score, and optional score details.
- `app/globals.css`: black borders, clear line, menu, minimal end screen, and petal burst.

---

### Task 1: Replaceable Personal-Best Storage

**Files:**
- Create: `game/scoreStore.ts`
- Test: `game/scoreStore.test.ts`

**Interfaces:**
- Produces: `ScoreStore { readBest(): number; writeBest(score: number): void }`, `createLocalScoreStore(storage?: Storage): ScoreStore`, and `updateBestScore(current: number, best: number, store: ScoreStore): number`.
- Consumes: browser `Storage` only through the factory boundary.

- [ ] **Step 1: Write failing storage tests**

```ts
test("reads zero for missing, invalid, and negative values", () => {
  const storage = new MemoryStorage();
  const store = createLocalScoreStore(storage);
  expect(store.readBest()).toBe(0);
  storage.setItem("logo-stack-best", "not-a-number");
  expect(store.readBest()).toBe(0);
  storage.setItem("logo-stack-best", "-50");
  expect(store.readBest()).toBe(0);
});

test("writes only a new personal best", () => {
  const store = createLocalScoreStore(new MemoryStorage());
  expect(updateBestScore(300, 200, store)).toBe(300);
  expect(store.readBest()).toBe(300);
  expect(updateBestScore(100, 300, store)).toBe(300);
});
```

Add a throwing `Storage` double and assert both read and write failures return safely without throwing.

- [ ] **Step 2: Verify RED**

Run: `npm test -- game/scoreStore.test.ts`

Expected: FAIL because `game/scoreStore.ts` does not exist.

- [ ] **Step 3: Implement the storage boundary**

Use the key `logo-stack-best`. Normalize values with `Number`, `Number.isFinite`, `Math.floor`, and a nonnegative check. Wrap storage calls in `try/catch`. `updateBestScore` writes only when `current > best` and returns the effective best.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- game/scoreStore.test.ts`

Expected: all score-store tests PASS.

### Task 2: Pause Menu and Minimal End Screen

**Files:**
- Create: `components/GameMenu.tsx`
- Test: `components/GameMenu.test.tsx`
- Modify: `components/GameOverOverlay.tsx`
- Modify: `components/GameHud.tsx`
- Test: `components/LogoStackGame.test.tsx`

**Interfaces:**
- Produces: `GameMenu({ onClose, onEndGame })`, `GameOverOverlay({ score, bestScore, showScore, onRetry, onEndGame, onViewScore })`, and new HUD props `bestScore` and `onMenu`.
- Consumes: current score/game phase from `LogoStackGame`.

- [ ] **Step 1: Write failing menu and end-screen tests**

Assert the three-line button has accessible name `Open menu`. Click it and assert a dialog named `Game menu` contains Shortcuts, How to Play, and End Game. Assert Escape closes it. Assert Rotate and Drop are disabled while open.

For the end screen, assert only Retry, End Game, and View Score actions are present. Click View Score and expect `Run score: 400` and `Best score: 900`; click it again and expect both details hidden.

- [ ] **Step 2: Verify RED**

Run: `npm test -- components/GameMenu.test.tsx components/LogoStackGame.test.tsx`

Expected: FAIL because the menu and new end-screen API are absent.

- [ ] **Step 3: Implement menu, HUD, and end-screen components**

Render the menu as an accessible modal dialog with a Close button, two concise information sections, and End Game. Add a `☰` button to the HUD. Display `Current` and `Best` values in the score panel. Replace existing end-screen prose with exactly the three actions and a conditional score-details region.

- [ ] **Step 4: Connect pause/end state in `LogoStackGame`**

Add `menuOpen`, `ended`, `showScore`, and `bestScore`. Read the best score after mount through `ScoreStore`. Escape toggles the menu unless ended. The menu End Game closes the menu and sets the same ended state as physics failure. Retry increments `runId`, clears current score, and leaves best score unchanged.

- [ ] **Step 5: Verify GREEN**

Run: `npm test -- components/GameMenu.test.tsx components/LogoStackGame.test.tsx`

Expected: menu, score, and end-screen tests PASS.

### Task 3: Height-Line Detection and Stack Clearing

**Files:**
- Modify: `components/GameCanvas.tsx`
- Modify: `game/types.ts`
- Test: `components/GameCanvas.test.tsx`
- Test: `components/LogoStackGame.e2e.test.tsx`

**Interfaces:**
- Produces: canvas props `paused: boolean`, `onClearLineReached(): void`, and handle method `clearLockedPieces(): void`; reports phase `clearing` through the shared `GamePhase` type.
- Consumes: the existing body list and fixed 60 FPS Matter.js update loop.

- [ ] **Step 1: Write failing canvas clear tests**

Create a test-only world through the real component, place a locked body whose `bounds.min.y` is at or above `CLEAR_LINE_Y = 165`, and verify `onClearLineReached` fires once. Verify paused movement/drop calls leave body position and phase unchanged. Call `clearLockedPieces` and assert locked sprites disappear while the active piece is retained.

- [ ] **Step 2: Verify RED**

Run: `npm test -- components/GameCanvas.test.tsx components/LogoStackGame.e2e.test.tsx`

Expected: FAIL because pause and clearing APIs are missing.

- [ ] **Step 3: Implement pause-aware physics**

Add `pausedRef` synchronized from props. Skip `Engine.update` and imperative move/rotate/drop when paused. Render a visible clear-line DOM element at `165 / 650 * 100%` of playfield height.

- [ ] **Step 4: Implement detection and clearing API**

After each lock, inspect all non-active bodies and trigger `onClearLineReached` once when `Math.min(...body.bounds.min.y) <= 165`. `clearLockedPieces` removes every non-active piece from the Matter world and `piecesRef`, then synchronizes sprites.

- [ ] **Step 5: Verify GREEN**

Run: `npm test -- components/GameCanvas.test.tsx components/LogoStackGame.e2e.test.tsx`

Expected: canvas pause and height-clear tests PASS alongside existing physics tests.

### Task 4: Clearing Animation, Score Continuity, and Final Theme

**Files:**
- Modify: `components/LogoStackGame.tsx`
- Modify: `components/GameHud.tsx`
- Modify: `app/globals.css`
- Test: `components/LogoStackGame.test.tsx`
- Test: `components/LogoStackGame.e2e.test.tsx`

**Interfaces:**
- Consumes: `ScoreStore`, pause menu, and `GameCanvas.clearLockedPieces()`.
- Produces: complete endless progression and final visual behavior.

- [ ] **Step 1: Write failing controller tests**

Emit a clear-line event after a 500-point lock. Assert controls disable during `clearing`, score stays 500, locked pieces receive a clearing class, and after 650 ms the canvas clear method is called, a new piece is aimable, and score is still 500. Mock `matchMedia('(prefers-reduced-motion: reduce)')` and assert the clear completes without the 650 ms travel delay.

- [ ] **Step 2: Verify RED**

Run: `npm test -- components/LogoStackGame.test.tsx components/LogoStackGame.e2e.test.tsx`

Expected: FAIL because the clearing controller is absent.

- [ ] **Step 3: Implement clearing orchestration**

When the canvas reports the clear line, set `clearing`, pause physics, and add `is-clearing` to the game board. After 650 ms—or 80 ms under reduced motion—call `clearLockedPieces`, advance `pieceId`, restore `aiming`, and retain current/best scores. Cancel the timer on restart or unmount.

- [ ] **Step 4: Apply final simple styling**

Set `.game-board-wrap`, `.hud-panel`, `.canvas-frame`, buttons, dialog, and clear line borders to `#000`. Add a small menu button. During `.is-clearing`, animate existing `.physics-piece` elements outward with opacity loss and overlay a restrained set of six pink petal dots inside the playfield only. Under reduced motion, remove translation/rotation and use opacity only.

- [ ] **Step 5: Run complete verification**

Run: `npm test -- --run`

Expected: all tests PASS.

Run: `npm run lint`

Expected: exit code 0.

Run: `npm run build`

Expected: exit code 0 with successful `/` and `/_not-found` routes.

Run: `npm audit --omit=dev`

Expected: zero known runtime vulnerabilities.
