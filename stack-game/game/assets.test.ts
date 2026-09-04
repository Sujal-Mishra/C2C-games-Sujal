// @vitest-environment node
import { readFileSync, statSync } from "node:fs";
import { expect, test } from "vitest";

test("the lantern artwork clips out the edition lettering", () => {
  const svg = readFileSync("public/assets/lantern.svg", "utf8");
  expect(svg).toContain('viewBox="120 140 520 620"');
});

test("the CC0 background soundtrack is bundled with the game", () => {
  expect(statSync("public/audio/hot-springs-town.mp3").size).toBeGreaterThan(1_000_000);
});
