import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import Page from "./page";

test("renders the game without a marketing heading", () => {
  render(<Page />);
  expect(screen.getByLabelText("Logo Stack playfield")).toBeVisible();
  expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
});
