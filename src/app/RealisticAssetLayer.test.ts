import { expect, it } from "vitest";
import { getRealisticAssetSummary } from "./RealisticAssetLayer";

it("describes the real asset layer for each task scene", () => {
  expect(getRealisticAssetSummary("demo01")).toContain("battery");
  expect(getRealisticAssetSummary("demo04")).toContain("screwdriver");
  expect(getRealisticAssetSummary("demo05")).toBe("pill-bottle,box,scanner,tray");
  expect(getRealisticAssetSummary("demo06")).toBe("apple,tray");
});
