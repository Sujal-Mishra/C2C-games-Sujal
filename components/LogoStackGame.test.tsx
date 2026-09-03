import { forwardRef, useImperativeHandle } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";

const canvasActions = vi.hoisted(() => ({
  moveBy: vi.fn(),
  rotate: vi.fn(),
  drop: vi.fn()
}));

vi.mock("./GameCanvas", () => ({
  GameCanvas: forwardRef(function FakeCanvas(props: {
    onLocked: () => void;
    onGameOver: () => void;
    onPhaseChange: (phase: string) => void;
  }, ref) {
    useImperativeHandle(ref, () => ({
      moveTo: vi.fn(),
      moveBy: canvasActions.moveBy,
      rotate: canvasActions.rotate,
      drop: () => {
        canvasActions.drop();
        props.onPhaseChange("falling");
      }
    }));
    return (
      <div aria-label="Logo Stack playfield">
        <button onClick={props.onLocked}>settle test piece</button>
        <button onClick={props.onGameOver}>lose test piece</button>
      </div>
    );
  })
}));

import { LogoStackGame } from "./LogoStackGame";

test("shows game information and disables aiming controls after drop", async () => {
  const user = userEvent.setup();
  render(<LogoStackGame />);

  expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
  expect(screen.getByLabelText("Score")).toHaveTextContent("0");
  expect(screen.getByText(/next object/i)).toBeVisible();
  expect(screen.getByText(/move.*rotate.*drop/i)).toBeVisible();
  expect(screen.queryByText(/^logo$|^blossom$/i)).not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /^drop$/i }));
  expect(screen.getByRole("button", { name: /^drop$/i })).toBeDisabled();
  expect(screen.getByRole("button", { name: /^rotate$/i })).toBeDisabled();
});

test("locking awards 100 points and enables the next piece", async () => {
  const user = userEvent.setup();
  render(<LogoStackGame />);

  await user.click(screen.getByRole("button", { name: /^drop$/i }));
  await user.click(screen.getByRole("button", { name: /settle test piece/i }));

  expect(screen.getByLabelText("Score")).toHaveTextContent("100");
  expect(screen.getByRole("button", { name: /^drop$/i })).toBeEnabled();
});

test("game over reports the final score and restart clears it", async () => {
  const user = userEvent.setup();
  render(<LogoStackGame />);

  await user.click(screen.getByRole("button", { name: /settle test piece/i }));
  await user.click(screen.getByRole("button", { name: /lose test piece/i }));
  expect(screen.getByRole("dialog", { name: /stack toppled/i })).toBeVisible();
  expect(screen.getByText(/final score: 100/i)).toBeVisible();

  await user.click(screen.getByRole("button", { name: /play again/i }));
  expect(screen.getByLabelText("Score")).toHaveTextContent("0");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("arrow keys move, Space rotates, and Enter drops", () => {
  canvasActions.moveBy.mockClear();
  canvasActions.rotate.mockClear();
  canvasActions.drop.mockClear();
  render(<LogoStackGame />);

  fireEvent.keyDown(window, { key: "ArrowLeft" });
  fireEvent.keyDown(window, { key: "ArrowRight" });
  fireEvent.keyDown(window, { key: " " });
  fireEvent.keyDown(window, { key: "Enter" });

  expect(canvasActions.moveBy).toHaveBeenNthCalledWith(1, -24);
  expect(canvasActions.moveBy).toHaveBeenNthCalledWith(2, 24);
  expect(canvasActions.rotate).toHaveBeenCalledOnce();
  expect(canvasActions.drop).toHaveBeenCalledOnce();
});
