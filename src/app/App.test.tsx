import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
import { App } from "./App";

beforeEach(() => {
  window.history.replaceState(null, "", "/");
});

it("renders one minimal six-scene showroom", () => {
  const { container } = render(<App />);

  expect(screen.queryByText("FRANKA PANDA · STATIC WORKCELLS")).not.toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "多机械臂场景展示" })).not.toBeInTheDocument();
  expect(screen.queryByText("六套多机械臂工位的空间构型与设备布局")).not.toBeInTheDocument();
  expect(container.querySelector(".app-shell")?.firstElementChild).toHaveClass("scene-selector");
  expect(screen.getAllByRole("button", { name: /场景 0[1-6]/ })).toHaveLength(6);
  expect(screen.getByTestId("scene-viewport")).toHaveAttribute("data-scene-id", "demo01");
  expect(screen.getByTestId("scene-viewport")).toHaveAttribute(
    "data-floor-style",
    "blue-checker-white-grid",
  );
  expect(screen.getByText("静态场景 · 拖动旋转 · 滚轮缩放")).toBeVisible();

  expect(screen.queryByText(/Line 1/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/Line 2/i)).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /播放|暂停|复位/ })).not.toBeInTheDocument();
  expect(screen.queryByText(/任务泳道|任务路径|SCENE STATUS|OBJECT FLOW|CURRENT REVIEW/)).not.toBeInTheDocument();
});

it("opens all six static workcells from the scene selector", () => {
  render(<App />);

  const expectedScenes = [
    ["01", "精密元器件检测与上料", "3 × Franka Panda"],
    ["02", "汽车低压线束四臂布线", "4 × Franka Panda"],
    ["03", "食品多规格装盒", "3 × Franka Panda"],
    ["04", "大型构件四臂协同装配", "4 × Franka Panda"],
    ["05", "智能药房错拣纠正", "3 × Franka Panda"],
    ["06", "岭南果品分选去核复作业", "3 × Franka Panda"],
  ] as const;

  for (const [number, heading, armCount] of expectedScenes) {
    fireEvent.click(screen.getByRole("button", { name: new RegExp(`场景 ${number}`) }));
    expect(screen.getByRole("heading", { name: heading })).toBeVisible();
    expect(screen.getAllByText(armCount).length).toBeGreaterThan(0);
    expect(screen.getByTestId("scene-viewport")).toHaveAttribute("data-scene-id", `demo${number}`);
  }
});

it("writes only the selected scene to the URL", () => {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /场景 05/ }));
  expect(window.location.search).toBe("?scene=demo05");
});

it("uses the MuJoCo Z-up convention", () => {
  render(<App />);
  expect(screen.getByTestId("scene-viewport")).toHaveAttribute("data-up-axis", "z");
});
