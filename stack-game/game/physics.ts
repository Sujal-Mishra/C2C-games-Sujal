import { Bodies, Body, type IBodyDefinition } from "matter-js";
import type { QuarterTurn, ShapeType } from "./types";
import { PIECE_STYLES } from "./pieces";

const MATERIAL: IBodyDefinition = {
  friction: 0.85,
  frictionStatic: 1,
  restitution: 0.08,
  frictionAir: 0.018,
  density: 0.0014
};

/** Collision geometry tuned to each asset's silhouette and aspect ratio. */
export function createPhysicsBody(type: ShapeType, x: number, y: number, turn: QuarterTurn): Body {
  const size = PIECE_STYLES[type].size;
  const style = PIECE_STYLES[type];
  const options = { ...MATERIAL, label: `piece:${type}`, render: { fillStyle: style.fill, strokeStyle: style.stroke, lineWidth: 4 }, plugin: { shapeType: type } };
  let body: Body;
  switch (type) {
    case "logo": body = Bodies.polygon(x, y, 6, size, options); break;
    case "blossom": body = Bodies.circle(x, y, size * 0.9, options); break;
    case "origami": body = Bodies.fromVertices(x, y, [[
      { x: -size * 0.82, y: size * 0.08 }, { x: 0, y: -size * 0.72 },
      { x: size * 0.84, y: size * 0.15 }, { x: 0, y: size * 0.76 }
    ]], options); break;
    case "lantern": body = Bodies.rectangle(x, y, size * 1.25, size * 1.08, options); break;
    case "butterfly": body = Bodies.fromVertices(x, y, [[
      { x: -size * 0.95, y: -size * 0.2 }, { x: -size * 0.2, y: -size * 0.65 },
      { x: 0, y: 0 }, { x: size * 0.2, y: -size * 0.65 },
      { x: size * 0.95, y: -size * 0.2 }, { x: size * 0.34, y: size * 0.7 },
      { x: 0, y: size * 0.25 }, { x: -size * 0.34, y: size * 0.7 }
    ]], options); break;
  }
  Body.setAngle(body, turn * Math.PI / 2);
  return body;
}
