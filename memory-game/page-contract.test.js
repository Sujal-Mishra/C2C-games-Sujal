import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const expectedAssets = [
  "Shark.png",
  "Jellyfish.png",
  "Fish.png",
  "ConeShell.png",
  "Snail.png",
  "Conch.png",
  "Turtle.png",
  "Seahorse.png",
  "Seagrass.png",
  "MantaRay.png",
  "Whale.png",
  "Coral.png",
  "C2C-Logo.svg",
  "cherry-blossom-ambience.mp3",
  "cookie-card.svg",
];

test("page has the required semantic game controls", async () => {
  const html = await readFile("index.html", "utf8");

  assert.doesNotMatch(html, /Cherry Match/i);
  assert.doesNotMatch(html, /Code to Create/i);
  assert.match(html, /href="https:\/\/c2c\.sh\/"/);
  assert.match(html, /src="assets\/C2C-Logo\.svg"/);
  assert.match(html, />\s*C2C\s*</);
  assert.match(html, /id="game-board"[^>]*role="grid"/);
  assert.match(html, /aria-rowcount="5"/);
  assert.match(html, /aria-colcount="5"/);
  assert.match(html, /id="game-status"[^>]*aria-live="polite"/);
  assert.match(html, /<dialog[^>]*id="completion-dialog"/);
  assert.match(html, /id="new-game"/);
  assert.match(html, /id="play-again"/);
  assert.match(html, /id="background-music"/);
  assert.match(html, /src="assets\/cherry-blossom-ambience\.mp3"/);
  assert.match(html, /id="music-toggle"/);
  assert.match(html, /id="music-seek"/);
  assert.doesNotMatch(html, /id="music-time"/);
  assert.match(html, /id="background-music"[^>]*autoplay/);
  assert.match(html, /id="best-score"/);
  assert.doesNotMatch(html, /How to play|Find every pair|Flip two/i);
});

test("all supplied card images are packaged locally", async () => {
  await Promise.all(expectedAssets.map((asset) => access(`assets/${asset}`)));
});

test("styles preserve five columns and accessibility preferences", async () => {
  const css = await readFile("styles.css", "utf8");

  assert.match(css, /grid-template-columns:\s*repeat\(5,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /prefers-color-scheme:\s*dark/);
  assert.doesNotMatch(css, /clip-path:\s*polygon/);
  assert.match(css, /\.waveform/);
  assert.doesNotMatch(css, /\.music-player:(?:hover|focus-within)/);
  assert.match(css, /\.music-player\s*\{[^}]*width:\s*255px/s);
  assert.doesNotMatch(css, /\.scoreboard:(?:hover|focus-within)/);
  assert.match(css, /\.scoreboard\s*\{[^}]*width:\s*328px/s);
  assert.doesNotMatch(css, /@media\s*\(hover:\s*none\)/);
  assert.match(css, /font-family:\s*"Oswald"/);
  assert.doesNotMatch(css, /monospace/i);
  assert.doesNotMatch(css, /(?:linear|radial)-gradient/i);
});

test("DOM integration imports engine and builds accessible card buttons", async () => {
  const script = await readFile("game.js", "utf8");

  assert.match(script, /createGame/);
  assert.match(script, /selectCard/);
  assert.match(script, /concealMismatch/);
  assert.match(script, /document\.createElement\("button"\)/);
  assert.match(script, /aria-label/);
  assert.match(script, /showModal\(\)/);
  assert.match(script, /center-blossom/);
  assert.match(script, /cookie-card\.svg/);
  assert.match(script, /assets\/\$\{card\.asset\}/);
  assert.match(script, /assets\/C2C-Logo\.svg/);
  assert.match(script, /localStorage/);
  assert.match(script, /c2c-memory-best-v1/);
  assert.match(script, /attemptAutoplay/);
  assert.match(script, /backgroundMusic/);
  assert.match(script, /musicSeek/);
  assert.doesNotMatch(script, /musicTime/);
  assert.match(script, /AudioContext/);
});
