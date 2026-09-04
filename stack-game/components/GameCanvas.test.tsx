import { createRef } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { GameCanvas, type GameCanvasHandle } from "./GameCanvas";

test("creates an accessible playfield and reports readiness", async () => {
  const onReady = vi.fn();
  render(
    <GameCanvas
      currentShape="logo"
      rotation={0}
      runId={0}
      onLocked={vi.fn()}
      onPieceMissed={vi.fn(() => true)}
      onGameOver={vi.fn()}
      onReady={onReady}
    />
  );

  expect(screen.getByRole("application", { name: /logo stack playfield/i })).toBeVisible();
  expect(screen.getByTestId("platform")).toBeVisible();
  expect(screen.getByTestId("platform-art")).toHaveAttribute("src", "/assets/sakura-stone-platform.svg");
  expect(screen.queryByTestId("platform-branch")).not.toBeInTheDocument();
  expect(screen.queryByTestId("platform-blossoms")).not.toBeInTheDocument();
  expect(document.querySelector(".clear-line")).not.toBeInTheDocument();
  expect(screen.getByAltText("Current logo piece")).toBeVisible();
  await waitFor(() => expect(onReady).toHaveBeenCalledOnce());
});

test("removes a missed active piece and reports the exhausted run", async () => {
  const ref = createRef<GameCanvasHandle>();
  const onPieceMissed = vi.fn(() => false);
  const onGameOver = vi.fn();
  const onReady = vi.fn();

  render(
    <GameCanvas
      ref={ref}
      currentShape="logo"
      rotation={0}
      runId={0}
      onLocked={vi.fn()}
      onPieceMissed={onPieceMissed}
      onGameOver={onGameOver}
      onReady={onReady}
    />
  );
  await waitFor(() => expect(onReady).toHaveBeenCalledOnce());

  act(() => {
    ref.current?.moveTo(70);
    ref.current?.drop();
  });

  await waitFor(() => expect(onPieceMissed).toHaveBeenCalledOnce(), { timeout: 6000 });
  expect(onGameOver).toHaveBeenCalledOnce();
  expect(screen.queryByAltText(/current .* piece/i)).not.toBeInTheDocument();
}, 7000);
