import { test } from "node:test";
import assert from "node:assert/strict";
import { scatter } from "./timing.ts";

test("scatter/chase follows the level-1 schedule", () => {
  assert.equal(scatter(0), true);
  assert.equal(scatter(34), true);
  assert.equal(scatter(35), false);
  assert.equal(scatter(135), true);
  assert.equal(scatter(1e6), false, "chase forever at the end");
});
