import { render, screen } from "@testing-library/react";
import { App } from "./App";

it("renders the six-demo product identity", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: "多机械臂协作演示平台" })).toBeVisible();
});
