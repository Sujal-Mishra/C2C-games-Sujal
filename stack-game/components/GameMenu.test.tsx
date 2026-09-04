import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { GameMenu } from "./GameMenu";

test("shows shortcuts and Continue without Retry", async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();
  const onContinue = vi.fn();
  render(<GameMenu onClose={onClose} onContinue={onContinue} showContinue />);

  expect(screen.getByRole("dialog", { name: "Game menu" })).toBeVisible();
  expect(screen.getByRole("dialog", { name: "Game menu" })).toHaveClass("wood-board");
  expect(screen.getByText("Shortcuts")).toBeVisible();
  expect(screen.getByText("How to play")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Close menu" }));
  expect(onClose).toHaveBeenCalledOnce();
  expect(screen.queryByRole("button", { name: "End game" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Continue" }));
  expect(onContinue).toHaveBeenCalledOnce();
  expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
});
