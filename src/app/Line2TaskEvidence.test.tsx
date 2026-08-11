import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "./App";

describe("Line2 task evidence", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/?line=line2&scene=demo01");
  });

  it("shows collaboration, the one-shot fault, recovery, oracle, and purposeful stages", () => {
    render(<App />);

    expect(screen.getByText(/Arm 1 保持 P1/)).toBeVisible();
    expect(screen.getByText(/P3 的背面标记缺失/)).toBeVisible();
    expect(screen.getByText(/Arm 2 将 P3 放入旁路缓存/)).toBeVisible();
    expect(screen.getByText(/P1→A1/)).toBeVisible();
    expect(screen.getByText("上料与扫码")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "播放任务路径" }));
    expect(screen.getByTestId("active-stage")).toHaveTextContent("上料与扫码");
    expect(screen.getByTestId("preview-status")).toHaveTextContent("任务路径预览中");
  });

  it("makes pharmacy verification and packaging a four-arm gated workflow", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /^05/ }));

    expect(screen.getByText("ARM 4 · 包装交付")).toBeVisible();
    expect(screen.getByText(/只有 PASS 后 Arm 4/)).toBeVisible();
    expect(screen.getByText(/B3 放入 return bin/)).toBeVisible();
    expect(screen.getByText("PASS 门控包装交付")).toBeVisible();
  });
});
