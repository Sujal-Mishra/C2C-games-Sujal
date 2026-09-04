import { concealMismatch, createGame, selectCard } from "./game-engine.js";

const board = document.querySelector("#game-board");
const movesOutput = document.querySelector("#moves");
const timerOutput = document.querySelector("#timer");
const pairsOutput = document.querySelector("#pairs");
const bestScoreOutput = document.querySelector("#best-score");
const statusOutput = document.querySelector("#game-status");
const newGameButton = document.querySelector("#new-game");
const dialog = document.querySelector("#completion-dialog");
const playAgainButton = document.querySelector("#play-again");
const closeDialogButton = document.querySelector("#close-dialog");
const finalMoves = document.querySelector("#final-moves");
const finalTime = document.querySelector("#final-time");
const newBestNote = document.querySelector("#new-best-note");
const backgroundMusic = document.querySelector("#background-music");
const musicToggle = document.querySelector("#music-toggle");
const musicSeek = document.querySelector("#music-seek");
const waveform = document.querySelector("#waveform");

let state = createGame();
let startedAt = null;
let timerId = null;
let mismatchId = null;
let soundContext = null;
let awaitingAutoplayGesture = false;

const BEST_SCORE_KEY = "c2c-memory-best-v1";

const waveHeights = [28, 46, 72, 40, 62, 88, 52, 34, 68, 94, 58, 38, 78, 54, 86, 42, 64, 32, 74, 92, 48, 66, 36, 82, 56, 70, 44, 84, 50, 30, 60, 76];

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function elapsedSeconds() {
  return startedAt === null ? 0 : Math.floor((Date.now() - startedAt) / 1000);
}

function updateTimer() {
  timerOutput.textContent = formatTime(elapsedSeconds());
}

function startTimer() {
  if (startedAt !== null) return;
  startedAt = Date.now();
  timerId = window.setInterval(updateTimer, 1000);
}

function stopTimer() {
  if (timerId !== null) {
    window.clearInterval(timerId);
    timerId = null;
  }
  updateTimer();
}

function cardLabel(card, visualIndex) {
  const position = `Card ${visualIndex + 1}`;
  if (card.isMatched) return `${position}: ${card.motif}, matched`;
  if (card.isFaceUp) return `${position}: ${card.motif}, face up`;
  return `${position}, face down`;
}

function makeCard(card, visualIndex) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "game-card";
  button.dataset.cardId = card.id;
  button.dataset.visualIndex = String(visualIndex);
  button.setAttribute("role", "gridcell");
  button.setAttribute("aria-rowindex", String(Math.floor(visualIndex / 5) + 1));
  button.setAttribute("aria-colindex", String((visualIndex % 5) + 1));
  button.setAttribute("aria-label", cardLabel(card, visualIndex));

  const inner = document.createElement("span");
  inner.className = "card-inner";
  inner.setAttribute("aria-hidden", "true");

  const back = document.createElement("span");
  back.className = "card-face card-back";

  const backImage = document.createElement("img");
  backImage.src = "assets/cookie-card.svg";
  backImage.alt = "";
  backImage.width = 96;
  backImage.height = 97;
  backImage.draggable = false;
  back.append(backImage);

  const front = document.createElement("span");
  front.className = "card-face card-front";

  const image = document.createElement("img");
  image.src = `assets/${card.asset}`;
  image.alt = "";
  image.width = 96;
  image.height = 97;
  image.draggable = false;

  front.append(image);
  inner.append(back, front);
  button.append(inner);
  return button;
}

function makeCenterBlossom() {
  const center = document.createElement("div");
  center.id = "center-blossom";
  center.className = "center-blossom";
  center.setAttribute("role", "gridcell");
  center.setAttribute("aria-rowindex", "3");
  center.setAttribute("aria-colindex", "3");
  center.setAttribute("aria-label", "C2C center tile");
  center.innerHTML = '<img src="assets/C2C-Logo.svg" alt="" width="96" height="97">';
  return center;
}

function buildBoard() {
  const fragment = document.createDocumentFragment();
  state.cards.forEach((card, index) => {
    if (index === 12) fragment.append(makeCenterBlossom());
    const visualIndex = index >= 12 ? index + 1 : index;
    fragment.append(makeCard(card, visualIndex));
  });
  board.replaceChildren(fragment);
}

function syncBoard() {
  const matchedPairs = state.cards.filter((card) => card.isMatched).length / 2;
  movesOutput.textContent = String(state.moves);
  pairsOutput.textContent = String(matchedPairs);

  board.querySelectorAll(".game-card").forEach((button, index) => {
    const card = state.cards[index];
    const visualIndex = Number(button.dataset.visualIndex);
    button.classList.toggle("is-face-up", card.isFaceUp);
    button.classList.toggle("is-matched", card.isMatched);
    button.disabled = card.isMatched;
    button.setAttribute("aria-label", cardLabel(card, visualIndex));
  });
}

function announce(message) {
  statusOutput.textContent = "";
  window.requestAnimationFrame(() => {
    statusOutput.textContent = message;
  });
}

function playRuffle() {
  try {
    const AudioEngine = window.AudioContext || window.webkitAudioContext;
    if (!AudioEngine) return;
    soundContext ||= new AudioEngine();
    if (soundContext.state === "suspended") soundContext.resume();

    const duration = 0.16;
    const frameCount = Math.floor(soundContext.sampleRate * duration);
    const buffer = soundContext.createBuffer(1, frameCount, soundContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < frameCount; index += 1) {
      const envelope = Math.pow(1 - index / frameCount, 2.3);
      data[index] = (Math.random() * 2 - 1) * envelope;
    }

    const source = soundContext.createBufferSource();
    const filter = soundContext.createBiquadFilter();
    const gain = soundContext.createGain();
    source.buffer = buffer;
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(2300, soundContext.currentTime);
    filter.frequency.exponentialRampToValueAtTime(900, soundContext.currentTime + duration);
    filter.Q.value = 0.7;
    gain.gain.setValueAtTime(0.055, soundContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, soundContext.currentTime + duration);
    source.connect(filter).connect(gain).connect(soundContext.destination);
    source.start();
  } catch {
    // Sound is an enhancement. The game stays playable if audio is unavailable.
  }
}

function readBestScore() {
  try {
    const parsed = JSON.parse(localStorage.getItem(BEST_SCORE_KEY));
    if (Number.isInteger(parsed?.moves) && Number.isInteger(parsed?.seconds)) return parsed;
  } catch {
    // Storage may be unavailable in privacy modes.
  }
  return null;
}

function isBetterScore(candidate, current) {
  return !current || candidate.moves < current.moves || (candidate.moves === current.moves && candidate.seconds < current.seconds);
}

function renderBestScore() {
  const best = readBestScore();
  bestScoreOutput.textContent = best ? String(best.moves) : "—";
  bestScoreOutput.title = best ? `${best.moves} moves in ${formatTime(best.seconds)}` : "No completed games yet";
}

function recordBestScore() {
  const candidate = { moves: state.moves, seconds: elapsedSeconds() };
  const current = readBestScore();
  const improved = isBetterScore(candidate, current);
  if (improved) {
    try {
      localStorage.setItem(BEST_SCORE_KEY, JSON.stringify(candidate));
    } catch {
      // The current result is still shown if persistence is unavailable.
    }
  }
  renderBestScore();
  return improved;
}

function finishGame() {
  stopTimer();
  const isNewBest = recordBestScore();
  finalMoves.textContent = `${state.moves} ${state.moves === 1 ? "move" : "moves"}`;
  finalTime.textContent = timerOutput.textContent;
  newBestNote.hidden = !isNewBest;
  announce(`Game complete in ${state.moves} moves and ${timerOutput.textContent}.`);
  window.setTimeout(() => dialog.showModal(), 360);
}

function handleSelection(cardId) {
  const result = selectCard(state, cardId);
  if (result.event.type === "ignored") return;

  playRuffle();
  startTimer();
  state = result.state;
  syncBoard();

  if (result.event.type === "match") {
    const card = state.cards.find((item) => item.pairKey === result.event.pairKey);
    announce(`${card.motif} matched.`);
  }

  if (result.event.type === "mismatch") {
    announce("No match.");
    mismatchId = window.setTimeout(() => {
      state = concealMismatch(state);
      mismatchId = null;
      syncBoard();
    }, 760);
  }

  if (result.event.type === "complete") finishGame();
}

function resetGame({ focusBoard = false } = {}) {
  if (mismatchId !== null) window.clearTimeout(mismatchId);
  if (timerId !== null) window.clearInterval(timerId);
  mismatchId = null;
  timerId = null;
  startedAt = null;
  timerOutput.textContent = "00:00";
  state = createGame();
  buildBoard();
  syncBoard();
  announce("New game ready.");
  if (focusBoard) board.querySelector("button")?.focus();
}

function buildWaveform() {
  const fragment = document.createDocumentFragment();
  waveHeights.forEach((height) => {
    const bar = document.createElement("span");
    bar.style.setProperty("--height", height);
    fragment.append(bar);
  });
  waveform.replaceChildren(fragment);
}

function syncMusicProgress() {
  const duration = Number.isFinite(backgroundMusic.duration) ? backgroundMusic.duration : 0;
  const progress = duration ? (backgroundMusic.currentTime / duration) * 100 : 0;
  musicSeek.value = String(progress);
  const playedBars = Math.round((progress / 100) * waveHeights.length);
  waveform.querySelectorAll("span").forEach((bar, index) => {
    bar.classList.toggle("played", index < playedBars);
  });
}

async function toggleMusic() {
  if (backgroundMusic.paused) {
    try {
      await backgroundMusic.play();
    } catch {
      announce("Background music could not start.");
    }
  } else {
    backgroundMusic.pause();
  }
}

function removeAutoplayFallback() {
  awaitingAutoplayGesture = false;
  document.removeEventListener("pointerdown", resumeMusicOnGesture);
  document.removeEventListener("keydown", resumeMusicOnGesture);
}

async function resumeMusicOnGesture(event) {
  removeAutoplayFallback();
  if (event.target.closest?.("#music-toggle")) return;
  try {
    await backgroundMusic.play();
  } catch {
    // The visible play control remains available.
  }
}

async function attemptAutoplay() {
  try {
    await backgroundMusic.play();
  } catch {
    awaitingAutoplayGesture = true;
    document.addEventListener("pointerdown", resumeMusicOnGesture, { once: true });
    document.addEventListener("keydown", resumeMusicOnGesture, { once: true });
  }
}

board.addEventListener("click", (event) => {
  const button = event.target.closest(".game-card");
  if (!button || !board.contains(button)) return;
  handleSelection(button.dataset.cardId);
});

newGameButton.addEventListener("click", () => {
  if (dialog.open) dialog.close();
  resetGame();
});

playAgainButton.addEventListener("click", () => {
  dialog.close();
  resetGame({ focusBoard: true });
});

closeDialogButton.addEventListener("click", () => dialog.close());
musicToggle.addEventListener("click", () => {
  if (awaitingAutoplayGesture) removeAutoplayFallback();
  toggleMusic();
});
backgroundMusic.addEventListener("timeupdate", syncMusicProgress);
backgroundMusic.addEventListener("play", () => {
  musicToggle.textContent = "Pause";
  musicToggle.setAttribute("aria-label", "Pause background music");
});
backgroundMusic.addEventListener("pause", () => {
  musicToggle.textContent = "Play";
  musicToggle.setAttribute("aria-label", "Play background music");
});
musicSeek.addEventListener("input", () => {
  if (!Number.isFinite(backgroundMusic.duration)) return;
  backgroundMusic.currentTime = (Number(musicSeek.value) / 100) * backgroundMusic.duration;
  syncMusicProgress();
});

backgroundMusic.volume = 0.34;
buildWaveform();
buildBoard();
syncBoard();
renderBestScore();
attemptAutoplay();
