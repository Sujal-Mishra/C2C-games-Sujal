import { describe, expect, test } from "vitest";
import { createPieceBody, PIECE_STYLES } from "./pieces";

describe("piece body factory", () => {
  test("logo creates a six-sided collision body", () => {
    const body = createPieceBody("logo", 100, 40, 0);
    expect(body.label).toBe("piece:logo");
    expect(body.vertices).toHaveLength(6);
  });

  test("blossom uses a compact round collision body", () => {
    const body = createPieceBody("blossom", 100, 40, 0);
    expect(body.circleRadius).toBeGreaterThan(0);
  });

  test("quarter-turn rotation is applied to both assets", () => {
    expect(createPieceBody("logo", 100, 40, 1).angle).toBeCloseTo(Math.PI / 2);
    expect(createPieceBody("blossom", 100, 40, 3).angle).toBeCloseTo(Math.PI * 1.5);
  });

  test.each(["logo", "blossom"] as const)(
    "%s uses forgiving arcade material settings",
    (shape) => {
      const body = createPieceBody(shape, 100, 40, 0);
      expect(body.friction).toBe(0.85);
      expect(body.frictionStatic).toBe(1);
      expect(body.restitution).toBe(0.08);
      expect(body.frictionAir).toBe(0.018);
      expect(body.plugin.shapeType).toBe(shape);
      expect(body.render.fillStyle).toBe(PIECE_STYLES[shape].fill);
    }
  );
});
