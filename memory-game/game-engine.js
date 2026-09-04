const MOTIFS = [
  { motif: "Shark", asset: "Shark.png" },
  { motif: "Jellyfish", asset: "Jellyfish.png" },
  { motif: "Fish", asset: "Fish.png" },
  { motif: "Cone shell", asset: "ConeShell.png" },
  { motif: "Snail", asset: "Snail.png" },
  { motif: "Conch", asset: "Conch.png" },
  { motif: "Sea turtle", asset: "Turtle.png" },
  { motif: "Seahorse", asset: "Seahorse.png" },
  { motif: "Seagrass", asset: "Seagrass.png" },
  { motif: "Manta ray", asset: "MantaRay.png" },
  { motif: "Whale", asset: "Whale.png" },
  { motif: "Coral", asset: "Coral.png" },
];

function shuffle(items, random) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

export function createDeck(random = Math.random) {
  const cards = MOTIFS.flatMap(({ motif, asset }) =>
    Array.from({ length: 2 }, (_, copy) => ({
        id: `${motif}-${copy}`,
        pairKey: motif,
        motif,
        asset,
        isFaceUp: false,
        isMatched: false,
      })),
  );
  return shuffle(cards, random);
}

export function createGame(random = Math.random) {
  return {
    cards: createDeck(random),
    moves: 0,
    selectedIds: [],
    pendingMismatch: [],
    status: "ready",
  };
}

function ignored(state) {
  return { state, event: { type: "ignored" } };
}

export function selectCard(state, cardId) {
  if (state.status === "complete" || state.pendingMismatch.length > 0) {
    return ignored(state);
  }

  const card = state.cards.find((item) => item.id === cardId);
  if (!card || card.isFaceUp || card.isMatched) {
    return ignored(state);
  }

  const cards = state.cards.map((item) =>
    item.id === cardId ? { ...item, isFaceUp: true } : item,
  );

  if (state.selectedIds.length === 0) {
    return {
      state: {
        ...state,
        cards,
        selectedIds: [cardId],
        status: "playing",
      },
      event: { type: "first", cardId },
    };
  }

  const firstId = state.selectedIds[0];
  const firstCard = cards.find((item) => item.id === firstId);
  const moves = state.moves + 1;

  if (firstCard.pairKey !== card.pairKey) {
    return {
      state: {
        ...state,
        cards,
        moves,
        selectedIds: [firstId, cardId],
        pendingMismatch: [firstId, cardId],
      },
      event: { type: "mismatch", cardIds: [firstId, cardId] },
    };
  }

  const matchedCards = cards.map((item) =>
    item.id === firstId || item.id === cardId
      ? { ...item, isMatched: true }
      : item,
  );
  const isComplete = matchedCards.every((item) => item.isMatched);

  return {
    state: {
      ...state,
      cards: matchedCards,
      moves,
      selectedIds: [],
      status: isComplete ? "complete" : "playing",
    },
    event: {
      type: isComplete ? "complete" : "match",
      pairKey: card.pairKey,
    },
  };
}

export function concealMismatch(state) {
  if (state.pendingMismatch.length === 0) {
    return state;
  }

  const pending = new Set(state.pendingMismatch);
  return {
    ...state,
    cards: state.cards.map((card) =>
      pending.has(card.id) && !card.isMatched
        ? { ...card, isFaceUp: false }
        : card,
    ),
    selectedIds: [],
    pendingMismatch: [],
  };
}
