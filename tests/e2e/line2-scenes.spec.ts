import { expect, test } from "@playwright/test";

const scenes = [
  { id: "demo01", number: "01", title: "精密电子检测、功能测试与上料", arms: 3, assets: "battery,tray,scanner" },
  { id: "demo02", number: "02", title: "汽车低压线束强协作布线", arms: 4, assets: "box,scanner" },
  { id: "demo03", number: "03", title: "食品多规格装盒、封签与称重", arms: 3, assets: "box,apple,electronic-scale,tray" },
  { id: "demo04", number: "04", title: "构件定位、紧固与质量扫描", arms: 4, assets: "screwdriver,box,scanner" },
  { id: "demo05", number: "05", title: "智能药房双处方纠错与包装", arms: 4, assets: "pill-bottle,box,scanner,tray" },
  { id: "demo06", number: "06", title: "岭南果品分选、去核与复作业", arms: 3, assets: "apple,tray" },
] as const;

test("renders all six task-ready Line2 MuJoCo workcells", async ({ page }) => {
  const browserErrors: string[] = [];
  const failedResponses: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
  });

  await page.goto("?line=line2&scene=demo01", { waitUntil: "domcontentloaded" });

  for (const scene of scenes) {
    if (scene.number !== "01") {
      await page.getByRole("button", { name: new RegExp(`^${scene.number}`) }).click();
    }

    await expect(page).toHaveURL(new RegExp(`line=line2&scene=${scene.id}`));
    await expect(page.getByRole("heading", { name: scene.title })).toBeVisible();
    const viewport = page.getByTestId("scene-viewport");
    await expect(viewport).toHaveAttribute("data-scene-id", scene.id);
    await expect(viewport).toHaveAttribute("data-line-id", "line2");
    await expect(viewport).toHaveAttribute("data-up-axis", "z");
    await expect(viewport).toHaveAttribute("data-scene-assets", scene.assets);
    await expect(page.locator(".scene-state strong")).toContainText(
      `${scene.arms} × Panda 与 Line2 工位已加载`,
      { timeout: 45_000 },
    );
    await expect(viewport.locator("canvas")).toBeVisible();
    await page.waitForTimeout(900);
    await page.screenshot({
      path: `project/checkpoints/2026-08-12-line2-scenes/${scene.id}-line2-workcell.png`,
      fullPage: false,
    });
  }

  expect(failedResponses, `HTTP failures:\n${failedResponses.join("\n")}`).toEqual([]);
  expect(browserErrors, `Browser errors:\n${browserErrors.join("\n")}`).toEqual([]);
});

test("keeps Line1 available from a Line2 review URL", async ({ page }) => {
  await page.goto("?line=line2&scene=demo05");
  await page.getByRole("button", { name: /Line 1/ }).click();
  await expect(page).toHaveURL(/line=line1&scene=demo05/);
  await expect(page.getByRole("heading", { name: "智能药房错拣纠正" })).toBeVisible();
  await expect(page.getByTestId("scene-viewport")).toHaveAttribute("data-scene-assets", "");
});
