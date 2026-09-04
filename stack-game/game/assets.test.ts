// @vitest-environment node
import { readFileSync } from "node:fs";
import { expect, test } from "vitest";

test("the lantern artwork clips out the edition lettering", () => {
  const svg = readFileSync("public/assets/lantern.svg", "utf8");
  expect(svg).toContain('viewBox="120 140 520 620"');
});
