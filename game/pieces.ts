import { Bodies, Body } from "matter-js";
import type { QuarterTurn, ShapeType } from "./types";

export interface PieceStyle {
  fill: string;
  stroke: string;
  accent: string;
  size: number;
}

export const PIECE_STYLES: Record<ShapeType, PieceStyle> = {
  logo: { fill: "#2c2c2c", stroke: "#f4b8d0", accent: "#d37fa2", size: 47 },
  blossom: { fill: "#d37fa2", stroke: "#fbe2ec", accent: "#ffffff", size: 43 }
};

const MATERIAL = {
  friction: 0.85,
  frictionStatic: 1,
  restitution: 0.08,
  frictionAir: 0.018,
  density: 0.0014
};

export function createPieceBody(
  type: ShapeType,
  x: number,
  y: number,
  turn: QuarterTurn
): Body {
  const style = PIECE_STYLES[type];
  const options = {
    ...MATERIAL,
    label: `piece:${type}`,
    render: {
      fillStyle: style.fill,
      strokeStyle: style.stroke,
      lineWidth: 4
    },
    plugin: { shapeType: type }
  };

  let body: Body;
  if (type === "logo") {
    body = Bodies.polygon(x, y, 6, style.size, options);
  } else {
    body = Bodies.circle(x, y, style.size, options);
  }

  Body.setAngle(body, turn * (Math.PI / 2));
  return body;
}
