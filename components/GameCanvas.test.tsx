import { render, screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { GameCanvas } from "./GameCanvas";

test("creates an accessible playfield and reports readiness", async () => {
  const onReady = vi.fn();
  render(
    <GameCanvas
      currentShape="logo"
      rotation={0}
      runId={0}
      onLocked={vi.fn()}
      onGameOver={vi.fn()}
      onReady={onReady}
    />
  );

  expect(screen.getByRole("application", { name: /logo stack playfield/i })).toBeVisible();
  expect(screen.getByTestId("platform")).toBeVisible();
  expect(screen.queryByText("Clear line")).not.toBeInTheDocument();
  expect(screen.getByAltText("Current logo piece")).toBeVisible();
  await waitFor(() => expect(onReady).toHaveBeenCalledOnce());
});
