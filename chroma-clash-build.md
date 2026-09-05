# Chroma Clash build

## Goal
Ship a polished, playable public-game prototype with five-round color scoring and a lobby covering random and private team rooms.

## Tasks
- [x] Create the Vite/React foundation and the visual design specification → Verified with a production build.
- [x] Build deterministic HSV scoring and question data around the supplied logo → Verified three scoring edge cases in unit tests.
- [x] Implement lobby, random queue, team-room join/create, player cap, and game state transitions → Verified public and team-room paths in a browser.
- [x] Build the animated color picker, five-round stage, score reveal, and leaderboard → Verified the interactive game stage in a browser.
- [x] Run lint, tests, production build, and a browser smoke test.

## Done When
- [x] Players can complete a five-round game and receive a calculated result.
- [x] Players can choose a random room or create/join a five-player private team room.
- [x] The supplied artwork appears as a question card without using third-party branding.
