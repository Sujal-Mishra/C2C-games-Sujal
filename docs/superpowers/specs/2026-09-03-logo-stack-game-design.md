# Logo Stack Game Design

## Purpose

Create a responsive, arcade-style stacking game inspired by Animal Stack. Players position and rotate branded pieces above a platform, drop them into a physics simulation, and build the tallest stable stack they can. Placeholder pieces will initially represent future logos.

## Technology

- Next.js with React and TypeScript
- Matter.js for two-dimensional rigid-body physics
- HTML canvas for the physical playfield
- CSS for the interface, scenery, responsive layout, and decorative animation
- Unit tests for deterministic game rules and state transitions

The project will remain a focused single-page game without accounts, networking, persistence, or a backend.

## Visual Direction

The design follows the supplied Code2Create reference:

- Deep burgundy and near-black background tones
- Cherry-blossom pink accents and pale pink borders
- White display typography with restrained uppercase labels
- Dark green landscape silhouettes beneath the play area
- Lightweight animated petals for depth and atmosphere
- Soft glows and outlined panels that complement the event identity

The game objects will be a circle, a square initially presented at a diamond angle, and a hexagon. Each piece will use a distinct pink shade and clear internal detailing so its rotation remains readable.

## Layout

The game occupies one responsive viewport and includes:

- A compact title and score area
- A next-piece preview
- A central canvas containing the drop zone and raised platform
- A visible guide showing the active piece's horizontal drop position
- Rotate and drop controls sized for touch interaction
- Short contextual instructions for desktop and mobile users
- A game-over overlay with the final result and a restart action

Desktop and mobile layouts use the same game rules. The canvas adapts to the available viewport while maintaining consistent world proportions and playable object sizes.

## Controls

While a piece is in the aiming state, players can move it anywhere across the valid horizontal drop range and rotate it in four 90-degree steps.

Desktop controls:

- Mouse movement or left/right arrow keys: position the active piece
- Left click, Space, or down arrow: drop
- Right click, `R`, or up arrow: rotate clockwise

Mobile controls:

- Horizontal drag across the playfield: position the active piece
- Rotate button: rotate clockwise
- Drop button: drop

Inputs that could create another piece or reposition the active piece are ignored while a piece is falling or settling.

## Pieces and Physics

Matter.js simulates gravity, collisions, angular motion, and stacking. Pieces use:

- High surface friction
- Low restitution for mild bounce
- Moderate air resistance and angular damping
- Slightly generous collision shapes and mass tuning for an arcade-like feel

The platform is a fixed physics body. Previously locked pieces become fixed bodies, ensuring they cannot drift or move after settling.

A falling piece enters a settling phase after making contact. It locks when both its linear and angular speeds remain below tuned thresholds for approximately one second. If the piece begins moving meaningfully during that interval, the timer resets. This allows a piece to slide or tumble to a lower resting position before it is fixed.

## Game State

The controller uses these explicit states:

1. `aiming`: the current piece follows horizontal input and accepts rotation.
2. `falling`: gravity and collisions control the dropped piece.
3. `settling`: the piece is in contact and is monitored for sustained stability.
4. `locked`: the stable piece becomes fixed and awards points.
5. `gameOver`: a piece has fallen below the failure boundary and play is stopped.

After `locked`, the controller selects the next piece and returns to `aiming`. The selectable placeholder types are circle, diamond-oriented square, and hexagon. Selection may repeat and is random.

## Scoring and Failure

Each successfully locked piece adds 100 points. No points are granted merely for releasing or contacting a piece.

If the active or previously stacked piece crosses the lower failure boundary outside the platform, the run ends. The game-over overlay may show the run's final score, but choosing restart immediately creates a fresh world with a score of zero and an empty platform.

## Component Boundaries

- `GamePage`: assembles the themed page and owns high-level run state.
- `GameCanvas`: creates and tears down Matter.js, renders the world, and forwards physics events.
- `gameController`: handles the state machine, piece lifecycle, score events, settling rules, and failure detection independently of React rendering.
- `pieceFactory`: defines each piece's geometry and tuned physical properties.
- `GameHud`: displays score, next piece, control hints, and touch actions.
- `GameOverOverlay`: reports the end of a run and requests restart.

The controller and piece definitions expose small deterministic interfaces so rule behavior can be tested without rendering a browser canvas.

## Error and Lifecycle Handling

- Matter.js resources, event handlers, animation frames, and resize observers are removed when the canvas unmounts or a run restarts.
- Pointer coordinates are clamped to the valid horizontal spawn range.
- Repeated drop and rotation actions are ignored outside the aiming state.
- Resize changes update rendering dimensions and input mapping without resetting the current run.
- Touch controls prevent accidental browser scrolling only inside the interactive playfield.

## Accessibility

- Every action has keyboard and touch-capable alternatives.
- Buttons have visible labels and focus states.
- Score and game-over status are represented in semantic HTML outside the canvas.
- Pink accents retain readable contrast against the dark background.
- Decorative petal animation respects `prefers-reduced-motion`.

## Testing and Acceptance Criteria

Automated tests will cover:

- Rotation cycles through four orientations and wraps correctly.
- Position input is clamped to the spawn range.
- Drop input changes `aiming` to `falling` only once.
- Sustained low motion locks a piece; renewed motion resets settlement.
- A locked piece adds exactly 100 points.
- Crossing the lower boundary enters `gameOver`.
- Restart clears pieces and returns the score to zero.
- Piece selection returns only supported types.

Implementation is accepted when:

- Circle, diamond, and hexagon pieces can be positioned, rotated, and dropped.
- Pieces visibly respond to gravity and collisions, then become immovable after settling.
- Stable pieces award points and trigger the next piece.
- A fallen piece ends the run, and restart begins from score zero.
- Mouse, keyboard, and touch controls work at representative desktop and mobile sizes.
- The page matches the agreed cherry-blossom theme.
- Unit tests and the production Next.js build pass without errors.
