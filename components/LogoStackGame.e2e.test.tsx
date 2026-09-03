import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, test } from "vitest";
import { LogoStackGame } from "./LogoStackGame";

test("mouse movement and clicking do not control or drop the piece", async () => {
  render(<LogoStackGame />);
  const playfield = screen.getByRole("application", { name: /logo stack playfield/i });
  const piece = await screen.findByAltText("Current logo piece");
  const startingLeft = piece.style.left;

  Object.defineProperty(playfield, "getBoundingClientRect", {
    value: () => ({ left: 0, top: 0, width: 900, height: 650, right: 900, bottom: 650, x: 0, y: 0, toJSON: () => ({}) })
  });
  fireEvent.pointerMove(playfield, { clientX: 760, pointerType: "mouse" });
  fireEvent.click(playfield, { detail: 1 });

  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(piece.style.left).toBe(startingLeft);
  expect(screen.getByRole("button", { name: /^drop$/i })).toBeEnabled();
});

test("A, D, and arrow keys move while Space rotates and Enter continuously drops", async () => {
  render(<LogoStackGame />);

  expect(screen.getByTestId("platform")).toBeVisible();
  const piece = await screen.findByAltText("Current logo piece");
  const startingLeft = piece.style.left;
  const startingTop = Number.parseFloat(piece.style.top);

  fireEvent.keyDown(window, { key: "d" });
  await waitFor(() => expect(piece.style.left).not.toBe(startingLeft));

  const afterD = piece.style.left;
  fireEvent.keyDown(window, { key: "ArrowLeft" });
  await waitFor(() => expect(piece.style.left).not.toBe(afterD));

  const afterLeft = piece.style.left;
  fireEvent.keyDown(window, { key: "a" });
  await waitFor(() => expect(piece.style.left).not.toBe(afterLeft));

  fireEvent.keyDown(window, { key: " " });
  await waitFor(() => expect(piece.style.transform).toContain("1.570796"));

  fireEvent.keyDown(window, { key: "Enter" });
  let previousTop = startingTop;
  await waitFor(
    () => {
      const currentTop = Number.parseFloat(piece.style.top);
      expect(currentTop).toBeGreaterThan(previousTop);
      previousTop = currentTop;
    },
    { timeout: 1500 }
  );
});

test("touch tap rotates and horizontal swipe moves without dropping", async () => {
  render(<LogoStackGame />);
  const playfield = screen.getByRole("application", { name: /logo stack playfield/i });
  const piece = await screen.findByAltText("Current logo piece");
  const startingLeft = piece.style.left;

  fireEvent.pointerDown(playfield, { pointerId: 1, pointerType: "touch", clientX: 450, clientY: 200 });
  fireEvent.pointerUp(playfield, { pointerId: 1, pointerType: "touch", clientX: 450, clientY: 200 });
  await waitFor(() => expect(piece.style.transform).toContain("1.570796"));

  fireEvent.pointerDown(playfield, { pointerId: 2, pointerType: "touch", clientX: 450, clientY: 200 });
  fireEvent.pointerUp(playfield, { pointerId: 2, pointerType: "touch", clientX: 560, clientY: 205 });
  await waitFor(() => expect(piece.style.left).not.toBe(startingLeft));
  expect(screen.getByRole("button", { name: /^drop$/i })).toBeEnabled();
});

test("Enter releases the piece visibly, lets it settle on the platform, then locks it", async () => {
  render(<LogoStackGame />);
  const piece = await screen.findByAltText("Current logo piece");
  const startingTop = Number.parseFloat(piece.style.top);

  fireEvent.keyDown(window, { key: "Enter" });
  await new Promise((resolve) => setTimeout(resolve, 120));
  const fallingTop = Number.parseFloat(piece.style.top);
  expect(fallingTop - startingTop).toBeGreaterThan(2);

  await new Promise((resolve) => setTimeout(resolve, 180));
  expect(Number.parseFloat(piece.style.top)).toBeGreaterThan(fallingTop);

  await waitFor(() => expect(screen.getByLabelText("Current score")).toHaveTextContent("100"), {
    timeout: 5000,
    interval: 50
  });

  const lockedTop = piece.style.top;
  await new Promise((resolve) => setTimeout(resolve, 180));
  expect(piece.style.top).toBe(lockedTop);
}, 7000);
