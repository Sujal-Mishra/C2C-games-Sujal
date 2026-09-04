import type { QuarterTurn, ShapeType } from "./types";
import type { Body } from "matter-js";
import { createPhysicsBody } from "./physics";

export interface PieceStyle {
  fill: string;
  stroke: string;
  accent: string;
  size: number;
}

export const PIECE_STYLES: Record<ShapeType, PieceStyle> = {
  logo: { fill: "#2c2c2c", stroke: "#f4b8d0", accent: "#d37fa2", size: 42 },
  petal: { fill: "#d884a2", stroke: "#fbe2ec", accent: "#ffffff", size: 42 },
  origami: { fill: "#d99a63", stroke: "#fbe2ec", accent: "#fff0dc", size: 42 },
  lantern: { fill: "#e56f8f", stroke: "#ffd4df", accent: "#ffe3a8", size: 42 },
  butterfly: { fill: "#8da9dc", stroke: "#e5edff", accent: "#f5b3cf", size: 42 }
};

export function createPieceBody(
  type: ShapeType,
  x: number,
  y: number,
  turn: QuarterTurn
): Body {
  return createPhysicsBody(type, x, y, turn);
}
