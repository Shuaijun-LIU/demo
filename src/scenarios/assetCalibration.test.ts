import { describe, expect, it } from "vitest";
import { ASSET_REGISTRY, getSceneAssetInstances } from "./assetRegistry";

describe("Line2 RoboTwin asset calibration", () => {
  it("uses source metadata scale instead of oversized hand tuning", () => {
    expect(ASSET_REGISTRY.box.sourceScale).toEqual([0.05, 0.05, 0.05]);
    expect(ASSET_REGISTRY.tray.sourceScale).toEqual([0.16, 0.16, 0.16]);
    expect(ASSET_REGISTRY.scanner.sourceScale).toEqual([0.08, 0.08, 0.08]);
    expect(ASSET_REGISTRY.screwdriver.sourceScale).toEqual([0.095, 0.095, 0.095]);
    expect(ASSET_REGISTRY["pill-bottle"].sourceScale).toEqual([0.08, 0.08, 0.08]);
    expect(Object.values(ASSET_REGISTRY).every((asset) => asset.upAxis === "y")).toBe(true);
  });

  it("binds one visible task asset in every scene to the physical payload body", () => {
    for (const sceneId of ["demo01", "demo02", "demo03", "demo04", "demo05", "demo06"] as const) {
      const payloads = getSceneAssetInstances(sceneId).filter((instance) => instance.bodyName === "task_payload");
      expect(payloads).toHaveLength(1);
      expect(payloads[0].scale.every((value) => value >= 0.75 && value <= 1.25)).toBe(true);
    }
  });
});
