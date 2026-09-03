import { forwardRef, useImperativeHandle } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";

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

test("shows only the playfield with score and two lives at its side", () => {
  render(<LogoStackGame />);

  expect(screen.getByLabelText("Current score")).toHaveTextContent("0");
  expect(screen.getByLabelText("Lives remaining")).toHaveTextContent("2");
  expect(screen.getByRole("complementary", { name: /game status/i })).toBeVisible();
  expect(screen.queryByLabelText("Best score")).not.toBeInTheDocument();
  expect(screen.queryByText(/next object/i)).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /^drop$|^rotate$|open menu/i })).not.toBeInTheDocument();
  expect(screen.queryByText(/desktop:|phone:/i)).not.toBeInTheDocument();
});

test("each locked component awards exactly 100 points", async () => {
  const user = userEvent.setup();
  render(<LogoStackGame />);

  await user.click(screen.getByRole("button", { name: /settle test piece/i }));
  expect(screen.getByLabelText("Current score")).toHaveTextContent("100");
  expect(screen.getByLabelText("Lives remaining")).toHaveTextContent("2");

  await user.click(screen.getByRole("button", { name: /settle test piece/i }));
  expect(screen.getByLabelText("Current score")).toHaveTextContent("200");
});

test("the first miss starts an independent second life with a fresh score and world", async () => {
  const user = userEvent.setup();
  render(<LogoStackGame />);

  await user.click(screen.getByRole("button", { name: /settle test piece/i }));
  await user.click(screen.getByRole("button", { name: /lose test piece/i }));

  expect(screen.getByLabelText("Current score")).toHaveTextContent("0");
  expect(screen.getByLabelText("Lives remaining")).toHaveTextContent("1");
  expect(screen.getByTestId("canvas-run-id")).toHaveTextContent("1");
  expect(screen.queryByRole("dialog", { name: /game ended/i })).not.toBeInTheDocument();
  expect(screen.getByTestId("canvas-paused")).toHaveTextContent("false");
  expect(localStorage.getItem("logo-stack-best")).toBe("100");
});

test("the second miss ends the run and preserves the best score across both lives", async () => {
  const user = userEvent.setup();
  render(<LogoStackGame />);

  await user.click(screen.getByRole("button", { name: /settle test piece/i }));
  await user.click(screen.getByRole("button", { name: /settle test piece/i }));
  await user.click(screen.getByRole("button", { name: /lose test piece/i }));
  await user.click(screen.getByRole("button", { name: /settle test piece/i }));
  await user.click(screen.getByRole("button", { name: /lose test piece/i }));

  expect(screen.getByLabelText("Lives remaining")).toHaveTextContent("0");
  expect(screen.getByRole("dialog", { name: /game ended/i })).toBeVisible();
  await user.click(screen.getByRole("button", { name: /view score/i }));
  expect(screen.getByText(/run score: 100/i)).toBeVisible();
  expect(screen.getByText(/best score: 200/i)).toBeVisible();
  expect(localStorage.getItem("logo-stack-best")).toBe("200");

  await user.click(screen.getByRole("button", { name: /^retry$/i }));
  expect(screen.getByLabelText("Current score")).toHaveTextContent("0");
  expect(screen.getByLabelText("Lives remaining")).toHaveTextContent("2");
  expect(localStorage.getItem("logo-stack-best")).toBe("200");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("Escape pauses and resumes the game without a header menu button", () => {
  render(<LogoStackGame />);

  fireEvent.keyDown(window, { key: "Escape" });
  expect(screen.getByRole("dialog", { name: /game menu/i })).toBeVisible();
  expect(screen.getByTestId("canvas-paused")).toHaveTextContent("true");

  fireEvent.keyDown(window, { key: "Escape" });
  expect(screen.queryByRole("dialog", { name: /game menu/i })).not.toBeInTheDocument();
  expect(screen.getByTestId("canvas-paused")).toHaveTextContent("false");
});

test("Retry in the pause menu resets the current run", async () => {
  const user = userEvent.setup();
  render(<LogoStackGame />);

  await user.click(screen.getByRole("button", { name: /settle test piece/i }));
  fireEvent.keyDown(window, { key: "Escape" });
  await user.click(screen.getByRole("button", { name: /^retry$/i }));

  expect(screen.getByLabelText("Current score")).toHaveTextContent("0");
  expect(screen.getByLabelText("Lives remaining")).toHaveTextContent("2");
});

test("keeps the personal best internally without showing it in the game header", async () => {
  localStorage.setItem("logo-stack-best", "900");
  const user = userEvent.setup();
  render(<LogoStackGame />);

  await user.click(screen.getByRole("button", { name: /settle test piece/i }));
  expect(localStorage.getItem("logo-stack-best")).toBe("900");
  expect(screen.queryByLabelText("Best score")).not.toBeInTheDocument();
});

test("arrow keys use minute movement while Space rotates and Enter drops", () => {
  render(<LogoStackGame />);

  fireEvent.keyDown(window, { key: "ArrowLeft" });
  fireEvent.keyDown(window, { key: "ArrowRight" });
  fireEvent.keyDown(window, { key: " " });
  fireEvent.keyDown(window, { key: "Enter" });

  expect(canvasActions.moveBy).toHaveBeenNthCalledWith(1, -8);
  expect(canvasActions.moveBy).toHaveBeenNthCalledWith(2, 8);
  expect(canvasActions.rotate).toHaveBeenCalledOnce();
  expect(canvasActions.drop).toHaveBeenCalledOnce();
});
