# Logo Stack Game Design

## Purpose

Create a responsive, endless arcade stacking game inspired by Animal Stack. Players position and rotate branded pieces above a platform, drop them into a physics simulation, and pursue the highest score possible across three lives. Placeholder pieces will initially represent future logos.

## Technology

- Next.js with React and TypeScript
- Matter.js for two-dimensional rigid-body physics
- A browser-rendered Matter.js playfield
- CSS for the interface, scenery, responsive layout, and decorative animation
- Unit tests for deterministic game rules and state transitions

The project will remain a focused single-page game without accounts, networking, persistence, or a backend.

## Visual Direction

The design follows the supplied Code2Create reference:

- A centered, true-black game card over a restrained blush-to-plum page background
- Cherry-blossom pink accents used sparingly for borders, values, and the platform
- Do Hyeon display typography in off-white with normal weight and line height
- Unboxed score and life information beside the playfield
- A small number of low-opacity animated petals for atmosphere, without tree artwork
- Soft shadows and subtle pink outlines that keep the interface minimal

The game objects will be a circle, a square initially presented at a diamond angle, and a hexagon. Each piece will use a distinct pink shade and clear internal detailing so its rotation remains readable.

## Layout

The game occupies one responsive viewport and includes only:

- The physical playfield and raised starting platform
- A compact side display for current score and remaining lives
- A game-over overlay with the final result and a restart action

There is no top HUD, next-piece preview, height line, or always-visible instruction row. When the top of the stable stack reaches the midpoint of the viewport, the camera scrolls upward and keeps following the stack. Locked pieces are retained so the run can continue without a height cap.

Desktop and mobile layouts use the same game rules. The canvas adapts to the available viewport while maintaining consistent world proportions and playable object sizes.

## Controls

While a piece is in the aiming state, players can move it anywhere across the valid horizontal drop range and rotate it in four 90-degree steps.

Desktop controls:

- `A` / `D` or left/right arrow keys: nudge the active piece by eight world units
- Space: rotate clockwise
- Enter: drop

Mobile controls:

- Horizontal swipe: nudge the active piece by eight world units
- Tap: rotate clockwise
- Downward swipe: drop

Mouse movement and clicks do not control the piece.

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

After `locked`, the controller selects the next randomized piece and returns to `aiming`. When the stack top reaches the viewport midpoint, the camera target moves upward while the aiming piece remains at a consistent on-screen spawn height.

## Scoring and Failure

Each successfully locked piece adds 100 points. No points are granted merely for releasing, contacting, or losing a piece.

Each run starts with three independent lives. If the active piece crosses the lower viewport failure boundary, that life ends. The first and second misses each consume one life and create a fresh physics world with an empty platform, a reset camera, and a score of zero. The third miss ends the run. The highest score achieved in any life is retained as the player's personal best in local storage, including across future sessions. Choosing restart creates a fresh world with three lives.

## Component Boundaries

- `GamePage`: assembles the themed page and owns high-level run state.
- `GameCanvas`: creates and tears down Matter.js, renders the world, and forwards physics events.
- `gameController`: handles the state machine, piece lifecycle, score events, settling rules, and failure detection independently of React rendering.
- `pieceFactory`: defines each piece's geometry and tuned physical properties.
- `GameHud`: displays only the current score and two-life status beside the playfield.
- `GameOverOverlay`: reports the end of a run and requests restart.

The controller and piece definitions expose small deterministic interfaces so rule behavior can be tested without rendering a browser canvas.

## Error and Lifecycle Handling

- Matter.js resources, event handlers, animation frames, and resize observers are removed when the canvas unmounts or a run restarts.
- Pointer coordinates are clamped to the valid horizontal spawn range.
- Repeated drop and rotation actions are ignored outside the aiming state.
- Touch controls prevent accidental browser scrolling only inside the interactive playfield.

## Accessibility

- Every gameplay action has keyboard and touch-gesture alternatives.
- Score and game-over status are represented in semantic HTML outside the canvas.
- Pink accents retain readable contrast against the dark background.

## Testing and Acceptance Criteria

Automated tests will cover:

- Rotation cycles through four orientations and wraps correctly.
- Position input is clamped to the spawn range.
- Drop input changes `aiming` to `falling` only once.
- Sustained low motion locks a piece; renewed motion resets settlement.
- A locked piece adds exactly 100 points.
- The first miss consumes one life and resets the score, locked stack, and camera for an independent second life.
- The third miss enters `gameOver`.
- Restart clears pieces and returns the score to zero and lives to two.
- The camera target moves upward when the stack reaches half the viewport height.
- Piece selection returns only supported types.

Implementation is accepted when:

- Randomized logo and blossom pieces can be positioned, rotated, and dropped.
- Pieces visibly respond to gravity and collisions, then become immovable after settling.
- Stable pieces award points and trigger the next piece.
- One fallen piece consumes a life; the second ends the run.
- Keyboard and touch controls work at representative desktop and mobile sizes.
- The page matches the agreed cherry-blossom theme.
- Unit tests and the production Next.js build pass without errors.
