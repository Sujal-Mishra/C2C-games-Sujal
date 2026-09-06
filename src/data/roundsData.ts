import { RoundDefinition } from "../types/game.types";

const roundPool: RoundDefinition[] = [
  {
    id: "round-1",
    label: "Mark of the moment",
    hint: "Set the color that lives at the center.",
    target: { hue: 338, saturation: 52, value: 72 },
    logoId: "pixel-logo",
    logoSource: "/color-change-logo.png",
    sourceColor: "pink",
  },
  {
    id: "round-2",
    label: "Neon snack",
    hint: "Match the blue square in the mark.",
    target: { hue: 200, saturation: 95, value: 88 },
    logoId: "pixel-logo",
    logoSource: "/blue-color-logo.png",
    sourceColor: "blue",
  },
  {
    id: "round-3",
    label: "Quiet edge",
    hint: "Match the purple chevrons in the mark.",
    target: { hue: 264, saturation: 86, value: 90 },
    logoId: "pixel-logo",
    logoSource: "/purple-color-logo.png",
    sourceColor: "purple",
  },
  {
    id: "round-4",
    label: "Soft spark",
    hint: "Match the blue Docker mark.",
    target: { hue: 205, saturation: 79, value: 89 },
    logoId: "pixel-logo",
    logoSource: "/docker-blue-logo.png",
    sourceColor: "blue",
  },
  {
    id: "round-5",
    label: "Final flash",
    hint: "Match the teal circle behind the mark.",
    target: { hue: 164, saturation: 92, value: 64 },
    logoId: "pixel-logo",
    logoSource: "/teal-color-logo.png",
    sourceColor: "teal",
  },
  { id: "round-6", label: "Teal direction", hint: "Match the teal arrow in the mark.", target: { hue: 155, saturation: 70, value: 78 }, logoId: "pixel-logo", logoSource: "/teal-arrow-logo.png", sourceColor: "teal" },
  { id: "round-7", label: "Warm spark", hint: "Match the orange behind the star.", target: { hue: 14, saturation: 60, value: 85 }, logoId: "pixel-logo", logoSource: "/orange-star-logo.jpg", sourceColor: "red-orange" },
  { id: "round-8", label: "Pink pathways", hint: "Match the pink connector in the mark.", target: { hue: 345, saturation: 77, value: 95 }, logoId: "pixel-logo", logoSource: "/pink-connector-logo.png", sourceColor: "pink" },
  { id: "round-9", label: "Chrome red", hint: "Match the red segment in the mark.", target: { hue: 4, saturation: 80, value: 90 }, logoId: "pixel-logo", logoSource: "/chrome-red-logo.webp", sourceColor: "red-orange" },
  { id: "round-10", label: "Green wordmark", hint: "Match the green Acer lettering.", target: { hue: 78, saturation: 92, value: 73 }, logoId: "pixel-logo", logoSource: "/acer-green-logo.png", sourceColor: "green" },
];

export function chooseRandomRounds(): RoundDefinition[] {
  // Pink targets pool for Q1 & Q2
  const pinkTargets = [
    { hue: 335, saturation: 65, value: 85 }, // Soft Rose Pink
    { hue: 345, saturation: 78, value: 90 }, // Vibrant Magenta Pink
    { hue: 325, saturation: 60, value: 80 }, // Deep Berry Pink
    { hue: 350, saturation: 72, value: 88 }, // Cherry Blossom Pink
    { hue: 330, saturation: 65, value: 80 }, // Classic C2C Pink
  ];

  // Shuffle pink targets so Q1 and Q2 get different pink gradients
  const shuffledPinks = [...pinkTargets].sort(() => Math.random() - 0.5);

  const q1: RoundDefinition = {
    id: "round-1",
    label: "Pink Memory I",
    hint: "Memorize this pink shade.",
    target: shuffledPinks[0],
    logoId: "pixel-logo",
    logoSource: "/color-change-logo.png",
    sourceColor: "pink",
  };

  const q2: RoundDefinition = {
    id: "round-2",
    label: "Pink Memory II",
    hint: "Memorize this pink shade.",
    target: shuffledPinks[1],
    logoId: "pixel-logo",
    logoSource: "/pink-connector-logo.png",
    sourceColor: "pink",
  };

  // Other colors for Q3, Q4, and Q5
  const nonPinkPool = roundPool.filter((r) => r.sourceColor !== "pink");
  const shuffledOthers = [...nonPinkPool].sort(() => Math.random() - 0.5);

  return [q1, q2, shuffledOthers[0], shuffledOthers[1], shuffledOthers[2]];
}
