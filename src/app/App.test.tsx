import { fireEvent, render, screen } from "@testing-library/react";
import { App } from "./App";

it("renders the six-demo product identity", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: "多机械臂协作演示平台" })).toBeVisible();
});

it("renders a checkable three-arm electronics workcell", () => {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /Line 1/ }));

  expect(screen.getByRole("heading", { name: "精密元器件检测与上料" })).toBeVisible();
  expect(screen.getByTestId("scene-viewport")).toBeVisible();
  expect(screen.getByText("ARM 1 · 上料")).toBeVisible();
  expect(screen.getByText("ARM 2 · 双面检测")).toBeVisible();
  expect(screen.getByText("ARM 3 · 测试分拣")).toBeVisible();
  expect(screen.getAllByTestId("workpiece")).toHaveLength(5);
  expect(screen.getByText("A 合格品")).toBeVisible();
  expect(screen.getByText("B 合格品")).toBeVisible();
  expect(screen.getByText("NG 隔离")).toBeVisible();
});

it("opens all six visual workcells from the scenario selector", () => {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /Line 1/ }));

  const expectedScenes = [
    ["01", "精密元器件检测与上料", "3 × Franka Panda"],
    ["02", "汽车低压线束四臂布线", "4 × Franka Panda"],
    ["03", "食品多规格装盒", "3 × Franka Panda"],
    ["04", "大型构件四臂协同装配", "4 × Franka Panda"],
    ["05", "智能药房错拣纠正", "3 × Franka Panda"],
    ["06", "岭南果品分选去核复作业", "3 × Franka Panda"],
  ] as const;

  for (const [number, heading, armCount] of expectedScenes) {
    const selector = screen.getByRole("button", { name: new RegExp(`^${number}`) });
    expect(selector).toBeEnabled();
    fireEvent.click(selector);
    expect(screen.getByRole("heading", { name: heading })).toBeVisible();
    expect(screen.getAllByText(armCount).length).toBeGreaterThan(0);
    expect(screen.getByTestId("scene-viewport")).toHaveAttribute(
      "data-scene-id",
      `demo${number}`,
    );
  }
});

it("uses the MuJoCo Z-up convention for every workcell", () => {
  render(<App />);
  expect(screen.getByTestId("scene-viewport")).toHaveAttribute("data-up-axis", "z");
});

it("controls the scene motion preview", () => {
  render(<App />);

  expect(screen.getByTestId("preview-status")).toHaveTextContent("待机");
  fireEvent.click(screen.getByRole("button", { name: "播放运动" }));
  expect(screen.getByTestId("preview-status")).toHaveTextContent("运动预览中");

  fireEvent.click(screen.getByRole("button", { name: "暂停运动" }));
  expect(screen.getByTestId("preview-status")).toHaveTextContent("已暂停");

  fireEvent.click(screen.getByRole("button", { name: "复位场景" }));
  expect(screen.getByTestId("preview-status")).toHaveTextContent("待机");
});
