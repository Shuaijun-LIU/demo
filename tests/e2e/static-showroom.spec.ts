import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const scenes = ["demo01", "demo02", "demo03", "demo04", "demo05", "demo06"] as const;
const checkpointDir = resolve(process.cwd(), "project/checkpoints/2026-08-13-mujoco-checker-floor");

test.beforeAll(() => {
  mkdirSync(checkpointDir, { recursive: true });
});

for (const sceneId of scenes) {
  test(`${sceneId} renders as a static light showroom`, async ({ page }) => {
    const browserErrors: string[] = [];
    page.on("pageerror", (error) => browserErrors.push(error.message));

    await page.goto(`?scene=${sceneId}`);

    await expect(page.getByText("FRANKA PANDA · STATIC WORKCELLS")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "多机械臂场景展示" })).toHaveCount(0);
    await expect(page.getByText("六套多机械臂工位的空间构型与设备布局")).toHaveCount(0);
    await expect(page.getByTestId("scene-viewport")).toHaveAttribute("data-scene-id", sceneId);
    await expect(page.getByTestId("scene-viewport")).toHaveAttribute(
      "data-floor-style",
      "blue-checker-white-grid",
    );
    await expect(page.getByTestId("scene-viewport")).toHaveAttribute("data-render-state", "ready");
    await expect(page.locator("canvas")).toBeVisible();
    await expect(page.getByRole("button", { name: /播放|暂停|重置/ })).toHaveCount(0);
    await expect(page.locator("body")).toHaveCSS("background-color", "rgb(242, 242, 239)");
    expect(browserErrors).toEqual([]);

    await page.screenshot({
      path: resolve(checkpointDir, `${sceneId}.png`),
      fullPage: true,
      animations: "disabled",
    });
  });
}
