import { expect, test } from "vitest";
import { createLocalScoreStore, updateBestScore } from "./scoreStore";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

test("reads zero for missing, invalid, and negative values", () => {
  const storage = new MemoryStorage();
  const store = createLocalScoreStore(storage);
  expect(store.readBest()).toBe(0);
  storage.setItem("logo-stack-best", "not-a-number");
  expect(store.readBest()).toBe(0);
  storage.setItem("logo-stack-best", "-50");
  expect(store.readBest()).toBe(0);
});

test("writes only a new personal best", () => {
  const store = createLocalScoreStore(new MemoryStorage());
  expect(updateBestScore(300, 200, store)).toBe(300);
  expect(store.readBest()).toBe(300);
  expect(updateBestScore(100, 300, store)).toBe(300);
  expect(store.readBest()).toBe(300);
});

test("storage failures never stop gameplay", () => {
  const throwing = {
    getItem() { throw new Error("blocked"); },
    setItem() { throw new Error("blocked"); }
  } as unknown as Storage;
  const store = createLocalScoreStore(throwing);
  expect(store.readBest()).toBe(0);
  expect(() => store.writeBest(200)).not.toThrow();
  expect(updateBestScore(200, 0, store)).toBe(200);
});
