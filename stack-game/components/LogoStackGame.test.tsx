import { forwardRef, useImperativeHandle } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

const canvasActions = vi.hoisted(() => ({
  moveBy: vi.fn(),
  rotate: vi.fn(),
  drop: vi.fn()
}));

vi.mock("./GameCanvas", () => ({
  GameCanvas: forwardRef(function FakeCanvas(props: {
    onLocked: () => void;
    onPieceMissed: () => boolean;
    onGameOver: () => void;
    onPhaseChange: (phase: string) => void;
    paused?: boolean;
    runId: number;
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

    const missPiece = () => {
      if (!props.onPieceMissed()) props.onGameOver();
    };

    return (
      <div aria-label="Logo Stack playfield">
        <span data-testid="canvas-paused">{String(Boolean(props.paused))}</span>
        <span data-testid="canvas-run-id">{props.runId}</span>
        <button onClick={props.onLocked}>settle test piece</button>
        <button onClick={missPiece}>lose test piece</button>
      </div>
    );
  })
}));

import { LogoStackGame } from "./LogoStackGame";

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

test("shows current and best scores with three flower lives in the game frame", () => {
  render(<LogoStackGame />);

  expect(screen.getByLabelText("Current score")).toHaveTextContent("0");
  expect(screen.getByLabelText("Lives remaining")).toHaveTextContent("3");
  expect(document.querySelectorAll(".life-pip")).toHaveLength(3);
  expect(document.querySelector(".lives-value")).not.toBeInTheDocument();
  const gameStatus = screen.getByRole("complementary", { name: /game status/i });
  expect(gameStatus).toBeVisible();
  expect(gameStatus.closest(".canvas-frame")).not.toBeNull();
  expect(screen.getByLabelText("Best score")).toHaveTextContent("0");
  expect(screen.queryByText(/next object/i)).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: /open menu/i })).toBeVisible();
  expect(screen.queryByText(/desktop:|phone:/i)).not.toBeInTheDocument();
  expect(document.querySelector(".tree-background")).not.toBeInTheDocument();
  expect(document.querySelectorAll(".ambient-petals i")).toHaveLength(12);
});

afterEach(() => vi.useRealTimers());

async function beginGame(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /^play$/i }));
  await user.click(screen.getByRole("button", { name: /^continue$/i }));
}

test("starts behind Play, then opens instructions and continues into gameplay", async () => {
  const user = userEvent.setup();
  render(<LogoStackGame />);
  expect(screen.getByRole("button", { name: /^play$/i })).toBeVisible();
  expect(screen.getByRole("button", { name: /^play$/i })).not.toHaveTextContent(/play/i);
  expect(screen.getByTestId("canvas-paused")).toHaveTextContent("true");
  await user.click(screen.getByRole("button", { name: /^play$/i }));
  expect(screen.getByRole("dialog", { name: /game menu/i })).toBeVisible();
  await user.click(screen.getByRole("button", { name: /^continue$/i }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.getByTestId("canvas-paused")).toHaveTextContent("false");
});

test("a lost life poofs into individual, varied petals before the next world starts", async () => {
  vi.useFakeTimers();
  render(<LogoStackGame />);
  fireEvent.click(screen.getByRole("button", { name: /lose test piece/i }));
  const petals = Array.from(document.querySelectorAll<HTMLElement>(".life-petal-poof i"));
  expect(petals).toHaveLength(16);
  expect(new Set(petals.map((petal) => petal.getAttribute("style"))).size).toBeGreaterThan(12);
  expect(screen.getByTestId("canvas-paused")).toHaveTextContent("true");
  expect(screen.getByTestId("canvas-run-id")).toHaveTextContent("0");
  await act(() => vi.advanceTimersByTimeAsync(650));
  expect(screen.getByTestId("canvas-run-id")).toHaveTextContent("1");
  vi.useRealTimers();
});

test("each locked component awards exactly 100 points", async () => {
  const user = userEvent.setup();
  render(<LogoStackGame />);

  await user.click(screen.getByRole("button", { name: /settle test piece/i }));
  expect(screen.getByLabelText("Current score")).toHaveTextContent("100");
  expect(screen.getByLabelText("Lives remaining")).toHaveTextContent("3");

  await user.click(screen.getByRole("button", { name: /settle test piece/i }));
  expect(screen.getByLabelText("Current score")).toHaveTextContent("200");
});

test("the first miss starts an independent second life with a fresh score and world", async () => {
  const user = userEvent.setup();
  render(<LogoStackGame />);
  await beginGame(user);

  await user.click(screen.getByRole("button", { name: /settle test piece/i }));
  await user.click(screen.getByRole("button", { name: /lose test piece/i }));

  await waitFor(() => expect(screen.getByTestId("canvas-run-id")).toHaveTextContent("1"), { timeout: 1200 });
  expect(screen.getByLabelText("Current score")).toHaveTextContent("0");
  expect(screen.getByLabelText("Lives remaining")).toHaveTextContent("2");
  expect(screen.getByTestId("canvas-run-id")).toHaveTextContent("1");
  expect(screen.queryByRole("dialog", { name: /game ended/i })).not.toBeInTheDocument();
  expect(screen.getByTestId("canvas-paused")).toHaveTextContent("false");
  expect(localStorage.getItem("logo-stack-best")).toBe("100");
});

test("the third miss ends the run and preserves the best score across all lives", async () => {
  const user = userEvent.setup();
  render(<LogoStackGame />);

  await user.click(screen.getByRole("button", { name: /settle test piece/i }));
  await user.click(screen.getByRole("button", { name: /settle test piece/i }));
  await user.click(screen.getByRole("button", { name: /lose test piece/i }));
  await waitFor(() => expect(screen.getByTestId("canvas-run-id")).toHaveTextContent("1"), { timeout: 1200 });
  await user.click(screen.getByRole("button", { name: /settle test piece/i }));
  await user.click(screen.getByRole("button", { name: /lose test piece/i }));
  await waitFor(() => expect(screen.getByTestId("canvas-run-id")).toHaveTextContent("2"), { timeout: 1200 });
  await user.click(screen.getByRole("button", { name: /settle test piece/i }));
  await user.click(screen.getByRole("button", { name: /lose test piece/i }));

  await waitFor(() => expect(screen.getByRole("dialog", { name: /game ended/i })).toBeVisible(), { timeout: 1200 });

  expect(screen.getByLabelText("Lives remaining")).toHaveTextContent("0");
  expect(screen.getByRole("dialog", { name: /game ended/i })).toBeVisible();
  expect(screen.queryByRole("button", { name: /^retry$/i })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /view score/i })).not.toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /game over/i })).toHaveClass("pixel-game-over");
  expect(screen.getByText(/score: 100/i)).toBeVisible();
  expect(localStorage.getItem("logo-stack-best")).toBe("200");

});

test("Escape and the header menu button open the same closable menu", async () => {
  const user = userEvent.setup();
  render(<LogoStackGame />);

  await beginGame(user);

  fireEvent.keyDown(window, { key: "Escape" });
  expect(screen.getByRole("dialog", { name: /game menu/i })).toBeVisible();
  expect(screen.getByTestId("canvas-paused")).toHaveTextContent("true");

  fireEvent.keyDown(window, { key: "Escape" });
  expect(screen.queryByRole("dialog", { name: /game menu/i })).not.toBeInTheDocument();
  expect(screen.getByTestId("canvas-paused")).toHaveTextContent("false");
  await user.click(screen.getByRole("button", { name: /open menu/i }));
  expect(screen.getByRole("dialog", { name: /game menu/i })).toBeVisible();
  await user.click(screen.getByRole("button", { name: /close menu/i }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("the pause menu never offers Retry", async () => {
  const user = userEvent.setup();
  render(<LogoStackGame />);

  await beginGame(user);
  fireEvent.keyDown(window, { key: "Escape" });
  expect(screen.queryByRole("button", { name: /^retry$/i })).not.toBeInTheDocument();
});

test("keeps the personal best internally while showing the best score for this run", async () => {
  localStorage.setItem("logo-stack-best", "900");
  const user = userEvent.setup();
  render(<LogoStackGame />);

  await user.click(screen.getByRole("button", { name: /settle test piece/i }));
  expect(localStorage.getItem("logo-stack-best")).toBe("900");
  expect(screen.getByLabelText("Best score")).toHaveTextContent("100");
});

test("arrow keys use minute movement while Space rotates and Enter drops", async () => {
  const user = userEvent.setup();
  render(<LogoStackGame />);
  await beginGame(user);

  fireEvent.keyDown(window, { key: "ArrowLeft" });
  fireEvent.keyDown(window, { key: "ArrowRight" });
  fireEvent.keyDown(window, { key: " " });
  fireEvent.keyDown(window, { key: "Enter" });

  expect(canvasActions.moveBy).toHaveBeenNthCalledWith(1, -8);
  expect(canvasActions.moveBy).toHaveBeenNthCalledWith(2, 8);
  expect(canvasActions.rotate).toHaveBeenCalledOnce();
  expect(canvasActions.drop).toHaveBeenCalledOnce();
});
