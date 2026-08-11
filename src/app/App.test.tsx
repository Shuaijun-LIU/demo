import { fireEvent, render, screen } from "@testing-library/react";
import { App } from "./App";

it("renders the six-demo product identity", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: "多机械臂协作演示平台" })).toBeVisible();
});

it("renders a checkable three-arm electronics workcell", () => {
  render(<App />);

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
