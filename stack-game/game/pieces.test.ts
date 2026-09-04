import { Bodies, Engine, World } from "matter-js";
import { describe, expect, test } from "vitest";
import { getPieceVisualPosition } from "./physics";
import { createPieceBody, PIECE_STYLES } from "./pieces";
import type { ShapeType } from "./types";

function dimensions(type: ShapeType) {
  const body = createPieceBody(type, 100, 40, 0);
  return {
    width: body.bounds.max.x - body.bounds.min.x,
    height: body.bounds.max.y - body.bounds.min.y
  };
}

describe("piece body factory", () => {
  test("logo collider follows the six-sided logo outline", () => {
    const body = createPieceBody("logo", 100, 40, 0);
    expect(body.label).toBe("piece:logo");
    expect(body.vertices).toHaveLength(6);
  });

  test("petal uses a tall asymmetric compound body instead of a circle", () => {
    const body = createPieceBody("petal", 100, 40, 0);
    const { width, height } = dimensions("petal");

    expect(body.circleRadius).toBe(0);
    expect(body.parts.length).toBeGreaterThan(2);
    expect(width).toBeGreaterThan(65);
    expect(height).toBeGreaterThan(80);
    expect(height).toBeGreaterThan(width);
  });

  test.each(["petal", "origami", "lantern", "butterfly"] as const)(
    "%s has approximately the logo's visual footprint",
    (shape) => {
      const logo = dimensions("logo");
      const logoExtent = Math.max(logo.width, logo.height);
      const piece = dimensions(shape);
      const extent = Math.max(piece.width, piece.height);
      expect(extent).toBeGreaterThan(logoExtent * 0.95);
      expect(extent).toBeLessThan(logoExtent * 1.05);
    }
  );

  test("asset-specific colliders match their visible proportions", () => {
    const origami = dimensions("origami");
    const lantern = dimensions("lantern");
    const butterfly = dimensions("butterfly");

    expect(origami.width).toBeGreaterThan(origami.height);
    expect(lantern.height).toBeGreaterThan(lantern.width);
    expect(butterfly.height).toBeGreaterThan(butterfly.width);
  });

  test("quarter-turn rotation preserves each asset's visual center", () => {
    const body = createPieceBody("petal", 100, 40, 3);
    expect(body.angle).toBeCloseTo(Math.PI * 1.5);
    expect(getPieceVisualPosition(body).x).toBeCloseTo(100);
    expect(getPieceVisualPosition(body).y).toBeCloseTo(40);
  });

  test("light paper assets use lower density and more air drag than the logo", () => {
    const logo = createPieceBody("logo", 100, 40, 0);
    const petal = createPieceBody("petal", 100, 40, 0);

    expect(petal.density).toBeLessThan(logo.density);
    expect(petal.frictionAir).toBeGreaterThan(logo.frictionAir);
    expect(petal.restitution).toBeLessThan(logo.restitution);
  });

  test("the petal falls, collides, and rests on the platform without sinking through", () => {
    const engine = Engine.create({ enableSleeping: true });
    const platform = Bodies.rectangle(100, 220, 240, 20, { isStatic: true });
    const petal = createPieceBody("petal", 100, 40, 0);
    World.add(engine.world, [platform, petal]);

    for (let frame = 0; frame < 600; frame += 1) Engine.update(engine, 1000 / 60);

    expect(petal.bounds.max.y).toBeGreaterThan(207);
    expect(petal.bounds.max.y).toBeLessThan(212);
    expect(petal.speed).toBeLessThan(0.2);
    expect(petal.angularSpeed).toBeLessThan(0.02);
  });

  test.each(["logo", "petal", "origami", "lantern", "butterfly"] as const)(
    "%s keeps its type and render metadata",
    (shape) => {
      const body = createPieceBody(shape, 100, 40, 0);
      expect(body.plugin.shapeType).toBe(shape);
      expect(body.render.fillStyle).toBe(PIECE_STYLES[shape].fill);
      expect(getPieceVisualPosition(body).x).toBeCloseTo(100);
      expect(getPieceVisualPosition(body).y).toBeCloseTo(40);
    }
  );
});
