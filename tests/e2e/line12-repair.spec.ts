import { expect, test } from "@playwright/test";

const scenes = ["demo01", "demo02", "demo03", "demo04", "demo05", "demo06"] as const;

for (const lineId of ["line1", "line2"] as const) {
  for (const sceneId of scenes) {
    test(`${lineId}/${sceneId} loads and begins task motion`, async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      page.on("pageerror", (error) => errors.push(error.message));

      await page.goto(`?line=${lineId}&scene=${sceneId}`, { waitUntil: "domcontentloaded" });
      const viewport = page.getByTestId("scene-viewport");
      await expect(viewport.locator("canvas")).toBeVisible();
      await expect(page.locator(".scene-state strong")).toContainText("工位已加载", { timeout: 45_000 });
      await page.getByRole("button", { name: /播放运动|播放任务路径/ }).click();
      await expect(page.locator(".loading-corner")).toContainText("TASK MOTION ACTIVE");
      await page.waitForTimeout(1_200);
      expect(errors, errors.join("\n")).toEqual([]);
    });
  }
}
