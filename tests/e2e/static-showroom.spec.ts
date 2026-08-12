import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const scenes = ["demo01", "demo02", "demo03", "demo04", "demo05", "demo06"] as const;
const checkpointDir = resolve(process.cwd(), "project/checkpoints/2026-08-12-static-showroom");

test.beforeAll(() => {
  mkdirSync(checkpointDir, { recursive: true });
});

for (const sceneId of scenes) {
  test(`${sceneId} renders as a static light showroom`, async ({ page }) => {
    const browserErrors: string[] = [];
    page.on("pageerror", (error) => browserErrors.push(error.message));

    await page.goto(`?scene=${sceneId}`);

    await expect(page.getByRole("heading", { name: "多机械臂场景展示" })).toBeVisible();
    await expect(page.getByTestId("scene-viewport")).toHaveAttribute("data-scene-id", sceneId);
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
