import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
import { App } from "./App";

beforeEach(() => {
  window.history.replaceState(null, "", "/demo/");
});

it("opens Line2 as the default review line", () => {
  render(<App />);

  expect(screen.getByRole("main")).toHaveAttribute("data-line", "line2");
  expect(screen.getByRole("button", { name: /Line 2/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(
    screen.getByRole("heading", { name: "精密电子检测、功能测试与上料" }),
  ).toBeVisible();
  expect(screen.getByTestId("scene-viewport")).toHaveAttribute("data-line-id", "line2");
});

it("switches back to the preserved Line1", () => {
  render(<App />);

  fireEvent.click(screen.getByRole("button", { name: /Line 1/ }));

  expect(screen.getByRole("main")).toHaveAttribute("data-line", "line1");
  expect(screen.getByRole("heading", { name: "精密元器件检测与上料" })).toBeVisible();
  expect(window.location.search).toBe("?line=line1&scene=demo01");
});

it("shows the pharmacy as a four-arm Line2 scene", () => {
  render(<App />);

  fireEvent.click(screen.getByRole("button", { name: /^05/ }));

  expect(
    screen.getByRole("heading", { name: "智能药房双处方纠错与包装" }),
  ).toBeVisible();
  expect(screen.getAllByText("4 × Franka Panda").length).toBeGreaterThan(0);
  expect(screen.getByText("ARM 4 · 包装交付")).toBeVisible();
  expect(window.location.search).toBe("?line=line2&scene=demo05");
});

it("restores a shared line and scene URL", () => {
  window.history.replaceState(null, "", "/demo/?line=line2&scene=demo06");

  render(<App />);

  expect(
    screen.getByRole("heading", { name: "岭南果品分选、去核与复作业" }),
  ).toBeVisible();
});
