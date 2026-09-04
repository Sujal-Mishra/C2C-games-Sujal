import test from "node:test";
import assert from "node:assert/strict";

import {
  concealMismatch,
  createDeck,
  createGame,
  selectCard,
} from "./game-engine.js";

function orderedRandom() {
  return 0.999999;
}

test("creates 24 cards as 12 distinct pairs using the new marine cookie artwork", () => {
  const deck = createDeck(orderedRandom);
  const groups = Map.groupBy(deck, (card) => card.pairKey);
  const expectedAssets = [
    "Shark.png", "Jellyfish.png", "Fish.png", "ConeShell.png",
    "Snail.png", "Conch.png", "Turtle.png", "Seahorse.png",
    "Seagrass.png", "MantaRay.png", "Whale.png", "Coral.png",
  ];

  assert.equal(deck.length, 24);
  assert.equal(groups.size, 12);
  assert.deepEqual([...new Set(deck.map((card) => card.asset))].sort(), expectedAssets.sort());
  assert.ok([...groups.values()].every((cards) => cards.length === 2));
  assert.ok(deck.every((card) => !("treatment" in card)));
});

test("first selection reveals one card without counting a move", () => {
  const game = createGame(orderedRandom);
  const result = selectCard(game, game.cards[0].id);

  assert.equal(result.event.type, "first");
  assert.equal(result.state.moves, 0);
  assert.deepEqual(result.state.selectedIds, [game.cards[0].id]);
  assert.equal(result.state.cards[0].isFaceUp, true);
});

test("matching pair stays face up and counts one move", () => {
  let game = createGame(orderedRandom);
  const [first, second] = game.cards.filter((card) => card.pairKey === game.cards[0].pairKey);

  game = selectCard(game, first.id).state;
  const result = selectCard(game, second.id);

  assert.equal(result.event.type, "match");
  assert.equal(result.state.moves, 1);
  assert.equal(result.state.selectedIds.length, 0);
  assert.ok(result.state.cards.filter((card) => card.pairKey === first.pairKey).every((card) => card.isMatched));
});

test("mismatch locks selection until both cards are concealed", () => {
  let game = createGame(orderedRandom);
  const first = game.cards[0];
  const second = game.cards.find((card) => card.pairKey !== first.pairKey);
  const third = game.cards.find((card) => ![first.id, second.id].includes(card.id));

  game = selectCard(game, first.id).state;
  const mismatch = selectCard(game, second.id);

  assert.equal(mismatch.event.type, "mismatch");
  assert.equal(mismatch.state.moves, 1);
  assert.deepEqual(mismatch.state.pendingMismatch, [first.id, second.id]);
  assert.equal(selectCard(mismatch.state, third.id).event.type, "ignored");

  const concealed = concealMismatch(mismatch.state);
  assert.equal(concealed.pendingMismatch.length, 0);
  assert.equal(concealed.selectedIds.length, 0);
  assert.equal(concealed.cards.find((card) => card.id === first.id).isFaceUp, false);
  assert.equal(concealed.cards.find((card) => card.id === second.id).isFaceUp, false);
});

test("duplicate, matched, and unknown selections are ignored", () => {
  let game = createGame(orderedRandom);
  const [first, second] = game.cards.filter((card) => card.pairKey === game.cards[0].pairKey);
  game = selectCard(game, first.id).state;

  assert.equal(selectCard(game, first.id).event.type, "ignored");
  assert.equal(selectCard(game, "missing-card").event.type, "ignored");

  game = selectCard(game, second.id).state;
  assert.equal(selectCard(game, first.id).event.type, "ignored");
});

test("matching every pair completes the game", () => {
  let game = createGame(orderedRandom);
  const groups = Map.groupBy(game.cards, (card) => card.pairKey);
  for (const cards of groups.values()) {
    for (let index = 0; index < cards.length; index += 2) {
      game = selectCard(game, cards[index].id).state;
      game = selectCard(game, cards[index + 1].id).state;
    }
  }

  assert.equal(game.status, "complete");
  assert.equal(game.moves, 12);
  assert.ok(game.cards.every((card) => card.isMatched));
});
