import { RoundDefinition } from "../types/game.types";

export const roundsData: RoundDefinition[] = [
  {
    id: "round-1",
    label: "Mark of the moment",
    hint: "Set the color that lives at the top-left facet.",
    target: { hue: 338, saturation: 52, value: 72 },
    logoId: "c2c-logo",
    targetFacetIndex: 0,
  },
  {
    id: "round-2",
    label: "Neon snack",
    hint: "Find the shade for the main left facet.",
    target: { hue: 348, saturation: 67, value: 82 },
    logoId: "c2c-logo",
    targetFacetIndex: 2,
  },
  {
    id: "round-3",
    label: "Quiet edge",
    hint: "What color sets the top-right highlight?",
    target: { hue: 223, saturation: 50, value: 75 },
    logoId: "c2c-logo",
    targetFacetIndex: 1,
  },
  {
    id: "round-4",
    label: "Soft spark",
    hint: "Tune the bottom-left base shade.",
    target: { hue: 0, saturation: 38, value: 96 },
    logoId: "c2c-logo",
    targetFacetIndex: 3,
  },
  {
    id: "round-5",
    label: "Final flash",
    hint: "Tune the bottom-right finishing facet.",
    target: { hue: 330, saturation: 69, value: 86 },
    logoId: "c2c-logo",
    targetFacetIndex: 4,
  },
];
