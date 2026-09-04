import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { GameOverOverlay } from "./GameOverOverlay";

test("shows a pixel game-over message and the final score without actions", () => {
  render(<GameOverOverlay score={400} />);
  expect(screen.getByRole("dialog", { name: "Game ended" })).toHaveClass("wood-board");
  expect(screen.getByRole("heading", { name: /game over/i })).toHaveClass("pixel-game-over");
  expect(screen.getByText("Score: 400")).toBeVisible();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
  expect(screen.queryByText(/best score/i)).not.toBeInTheDocument();
});
