# Stack Progression and Menu Design

## Purpose

Extend the playable logo stacking game with endless height-based progression, a persistent personal high score, and a compact pause/help/end-game menu while preserving the simple black-and-pink presentation.

## Visual Changes

- Change interface and playfield borders to black.
- Keep the solid near-black page background and the black-to-deep-pink ombré inside the game container.
- Add a small three-line menu button without introducing a title, heading, decorative background, or additional scenery.
- Show a subtle visible clear line near the top of the playfield.

## Height-Line Progression

A horizontal clear line appears near the top of the playable area. After a piece locks, the game checks the highest point of every locked body. If any locked body crosses the clear line:

1. Gameplay input is disabled.
2. Physics pauses for the clearing stack.
3. Every locked object transitions into a short pink-petal burst and fades away.
4. The cleared physics bodies are removed.
5. The current score is preserved.
6. A new active piece appears above the empty platform and play resumes automatically.

The clear animation is decorative and respects `prefers-reduced-motion`. With reduced motion enabled, objects fade quickly without traveling petals.

## Score Model

The HUD displays both:

- Current score for the active run.
- Best score achieved in this browser.

The current score continues across height-line clears. Retry resets the current score to zero but does not reset the best score. The best score updates as soon as the current score exceeds it.

Score persistence is accessed through a small `ScoreStore` interface. The first implementation uses browser `localStorage`. A later website integration can replace the storage implementation with an API-backed leaderboard without changing the game controller.

Invalid, missing, negative, or nonnumeric stored values resolve to zero. Storage access failures do not stop gameplay.

## Pause and Menu

Pressing `Escape` or the three-line menu button toggles the menu. Opening the menu pauses physics and disables gameplay controls. Closing it resumes the prior playable state.

The menu contains:

- **Shortcuts:** A/D or Left/Right to move, Space to rotate, Enter to drop, Escape to toggle the menu.
- **How to Play:** position and rotate the active object, drop it onto the platform or stack, and avoid falling off. Reaching the clear line removes the stack while preserving score.
- **End Game:** deliberately finishes the current run and opens the same end screen used after a failed drop.

## End Screen

The end screen avoids extra messaging and exposes only three actions:

- **Retry:** clears all bodies, resets current score to zero, and starts a new run.
- **End Game:** keeps the current run ended and hides any expanded score details.
- **View Score:** toggles a compact result showing the completed run score and locally stored personal best.

The end screen does not navigate because the standalone game has no surrounding website route yet.

## State and Component Changes

The game controller adds `paused`, `clearing`, and `ended` UI states without replacing the existing Matter.js lifecycle.

- `LogoStackGame` coordinates current/best scores, menu visibility, score details, run restart, and end-game actions.
- `GameCanvas` accepts a paused flag, reports when the height line is reached, and exposes a method to clear locked bodies after animation.
- `GameMenu` renders the pause/help/shortcuts interface.
- `GameOverOverlay` renders only the three required actions and optional score result.
- `scoreStore` isolates personal-best persistence behind a replaceable interface.

During menu pause, height-clear animation, or an ended run, movement, rotation, and drop inputs are ignored.

## Testing and Acceptance Criteria

Automated tests cover:

- Safe local high-score read/write and invalid-value handling.
- Best score updates without resetting on retry or height clear.
- Escape and menu button open/close the same paused menu.
- Physics and game controls are paused while the menu is open.
- A locked body crossing the clear line triggers clearing.
- Clearing removes locked bodies, preserves score, and resumes with a new piece.
- Reduced-motion clearing completes without traveling animation.
- Falling off and End Game open the same minimal end screen.
- Retry resets current score and starts a new run.
- View Score reveals run score and personal best.
- End Game keeps the run ended.

Implementation is accepted when all current gameplay tests, new progression/menu tests, TypeScript checking, and the production build pass.
