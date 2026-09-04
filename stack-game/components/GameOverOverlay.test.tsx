import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { GameOverOverlay } from "./GameOverOverlay";

test("shows only required actions and optional score details", async () => {
  const user = userEvent.setup();
  const onViewScore = vi.fn();
  const { rerender } = render(
    <GameOverOverlay score={400} bestScore={900} showScore={false} onRetry={vi.fn()} onViewScore={onViewScore} />
  );
  expect(screen.getByRole("button", { name: "Retry" })).toBeVisible();
  expect(screen.queryByRole("button", { name: "End game" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "View score" }));
  expect(onViewScore).toHaveBeenCalledOnce();
  expect(screen.queryByText("Run score: 400")).not.toBeInTheDocument();

  rerender(
    <GameOverOverlay score={400} bestScore={900} showScore onRetry={vi.fn()} onViewScore={onViewScore} />
  );
  expect(screen.getByText("Run score: 400")).toBeVisible();
  expect(screen.getByText("Best score: 900")).toBeVisible();
});
