import { forwardRef, useImperativeHandle } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";

const canvasActions = vi.hoisted(() => ({
  moveBy: vi.fn(),
  rotate: vi.fn(),
  drop: vi.fn(),
  clearLockedPieces: vi.fn()
}));

vi.mock("./GameCanvas", () => ({
  GameCanvas: forwardRef(function FakeCanvas(props: {
    onLocked: () => void;
    onGameOver: () => void;
    onPhaseChange: (phase: string) => void;
    paused?: boolean;
    onClearLineReached?: () => void;
  }, ref) {
    useImperativeHandle(ref, () => ({
      moveTo: vi.fn(),
      moveBy: canvasActions.moveBy,
      rotate: canvasActions.rotate,
      drop: () => {
        canvasActions.drop();
        props.onPhaseChange("falling");
      },
      clearLockedPieces: canvasActions.clearLockedPieces
    }));
    return (
      <div aria-label="Logo Stack playfield">
        <span data-testid="canvas-paused">{String(Boolean(props.paused))}</span>
        <button onClick={props.onLocked}>settle test piece</button>
        <button onClick={props.onGameOver}>lose test piece</button>
        {props.onClearLineReached && <button onClick={props.onClearLineReached}>reach clear line</button>}
      </div>
    );
  })
}));

import { LogoStackGame } from "./LogoStackGame";

beforeEach(() => localStorage.clear());

test("shows game information and disables aiming controls after drop", async () => {
  const user = userEvent.setup();
  render(<LogoStackGame />);

  expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
  expect(screen.getByLabelText("Current score")).toHaveTextContent("0");
  expect(screen.getByLabelText("Best score")).toHaveTextContent("0");
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

  expect(screen.getByLabelText("Current score")).toHaveTextContent("100");
  expect(screen.getByRole("button", { name: /^drop$/i })).toBeEnabled();
});

test("game over offers only required actions and retry clears current score", async () => {
  const user = userEvent.setup();
  render(<LogoStackGame />);

  await user.click(screen.getByRole("button", { name: /settle test piece/i }));
  await user.click(screen.getByRole("button", { name: /lose test piece/i }));
  expect(screen.getByRole("dialog", { name: /game ended/i })).toBeVisible();
  expect(screen.getByRole("button", { name: /view score/i })).toBeVisible();
  expect(screen.queryByText(/run score/i)).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /view score/i }));
  expect(screen.getByText(/run score: 100/i)).toBeVisible();

  await user.click(screen.getByRole("button", { name: /^retry$/i }));
  expect(screen.getByLabelText("Current score")).toHaveTextContent("0");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("menu button and Escape pause and resume the game", async () => {
  const user = userEvent.setup();
  render(<LogoStackGame />);
  await user.click(screen.getByRole("button", { name: /open menu/i }));
  expect(screen.getByRole("dialog", { name: /game menu/i })).toBeVisible();
  expect(screen.getByTestId("canvas-paused")).toHaveTextContent("true");
  expect(screen.getByRole("button", { name: /^drop$/i })).toBeDisabled();
  fireEvent.keyDown(window, { key: "Escape" });
  expect(screen.queryByRole("dialog", { name: /game menu/i })).not.toBeInTheDocument();
  expect(screen.getByTestId("canvas-paused")).toHaveTextContent("false");
});

test("Retry in the pause menu resets the current run", async () => {
  const user = userEvent.setup();
  render(<LogoStackGame />);
  await user.click(screen.getByRole("button", { name: /settle test piece/i }));
  await user.click(screen.getByRole("button", { name: /open menu/i }));
  await user.click(screen.getByRole("button", { name: /^retry$/i }));
  expect(screen.getByLabelText("Current score")).toHaveTextContent("0");
  expect(screen.queryByRole("dialog", { name: /game menu/i })).not.toBeInTheDocument();
});

test("reads and preserves the local personal best", async () => {
  localStorage.setItem("logo-stack-best", "900");
  render(<LogoStackGame />);
  expect(screen.getByLabelText("Current score")).toHaveTextContent("0");
  expect(screen.getByLabelText("Best score")).toHaveTextContent("900");
});

test("clears the stack after the height line without resetting score", async () => {
  vi.useFakeTimers();
  canvasActions.clearLockedPieces.mockClear();
  render(<LogoStackGame />);
  fireEvent.click(screen.getByRole("button", { name: /settle test piece/i }));
  fireEvent.click(screen.getByRole("button", { name: /reach clear line/i }));
  expect(screen.getByLabelText("Current score")).toHaveTextContent("100");
  expect(screen.getByTestId("canvas-paused")).toHaveTextContent("true");
  expect(screen.getByRole("button", { name: /^drop$/i })).toBeDisabled();
  await act(() => vi.advanceTimersByTimeAsync(650));
  expect(canvasActions.clearLockedPieces).toHaveBeenCalledOnce();
  expect(screen.getByLabelText("Current score")).toHaveTextContent("100");
  expect(screen.getByTestId("canvas-paused")).toHaveTextContent("false");
  vi.useRealTimers();
});

test("P previews the flower clearing animation in development", () => {
  render(<LogoStackGame />);
  fireEvent.keyDown(window, { key: "p" });
  expect(screen.getByTestId("canvas-paused")).toHaveTextContent("true");
  expect(document.querySelector(".petal-burst")).toBeInTheDocument();
  expect(document.querySelectorAll(".petal-burst i")).toHaveLength(14);
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
