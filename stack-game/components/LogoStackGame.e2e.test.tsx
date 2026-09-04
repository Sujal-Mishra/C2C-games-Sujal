import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, test } from "vitest";
import { LogoStackGame } from "./LogoStackGame";

function fireTouchPointer(
  target: Element,
  type: "pointerdown" | "pointerup",
  { clientX, clientY, pointerId }: { clientX: number; clientY: number; pointerId: number }
) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    pointerType: { value: "touch" },
    pointerId: { value: pointerId },
    clientX: { value: clientX },
    clientY: { value: clientY }
  });
  fireEvent(target, event);
}

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
  expect(screen.getByLabelText("Lives remaining")).toHaveTextContent("3");
});

test("A, D, and arrow keys move while Space rotates and Enter continuously drops", async () => {
  render(<LogoStackGame />);

  expect(screen.getByTestId("platform")).toBeVisible();
  const piece = await screen.findByAltText("Current logo piece");
  const startingLeft = piece.style.left;
  const startingTop = Number.parseFloat(piece.style.top);

  fireEvent.keyDown(window, { key: "d" });
  await waitFor(() => {
    expect(Number.parseFloat(piece.style.left) - Number.parseFloat(startingLeft)).toBeCloseTo(8 / 9, 2);
  });

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

test("touch tap rotates, horizontal swipe nudges, and downward swipe drops", async () => {
  render(<LogoStackGame />);
  const playfield = screen.getByRole("application", { name: /logo stack playfield/i });
  const piece = await screen.findByAltText("Current logo piece");
  const startingLeft = piece.style.left;

  fireTouchPointer(playfield, "pointerdown", { pointerId: 1, clientX: 450, clientY: 200 });
  fireTouchPointer(playfield, "pointerup", { pointerId: 1, clientX: 450, clientY: 200 });
  await waitFor(() => expect(piece.style.transform).toContain("1.570796"));

  fireTouchPointer(playfield, "pointerdown", { pointerId: 2, clientX: 450, clientY: 200 });
  fireTouchPointer(playfield, "pointerup", { pointerId: 2, clientX: 560, clientY: 205 });
  await waitFor(() => {
    expect(Number.parseFloat(piece.style.left) - Number.parseFloat(startingLeft)).toBeCloseTo(8 / 9, 2);
  });

  const aimingTop = Number.parseFloat(piece.style.top);
  fireTouchPointer(playfield, "pointerdown", { pointerId: 3, clientX: 450, clientY: 120 });
  fireTouchPointer(playfield, "pointerup", { pointerId: 3, clientX: 452, clientY: 210 });
  await waitFor(() => expect(Number.parseFloat(piece.style.top)).toBeGreaterThan(aimingTop));
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
