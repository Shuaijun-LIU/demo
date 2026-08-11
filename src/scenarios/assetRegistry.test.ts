import { describe, expect, it } from "vitest";
import {
  ASSET_REGISTRY,
  getAssetDefinition,
  getSceneAssetInstances,
} from "./assetRegistry";

describe("Line2 asset registry", () => {
  it("uses a licensed object set within the public Web budget", () => {
    const definitions = Object.values(ASSET_REGISTRY);
    const totalBytes = definitions.reduce((total, asset) => total + asset.bytes, 0);

    expect(definitions.map((asset) => asset.id)).toEqual(
      expect.arrayContaining(["battery", "box", "tray", "scanner", "electronic-scale", "screwdriver", "pill-bottle", "apple"]),
    );
    expect(totalBytes).toBeLessThanOrEqual(45 * 1024 * 1024);
    expect(definitions.every((asset) => asset.bytes <= 15 * 1024 * 1024)).toBe(true);
    expect(definitions.every((asset) => asset.license === "MIT")).toBe(true);
  });

  it("binds every scene asset to a canonical task object", () => {
    for (const sceneId of ["demo01", "demo02", "demo03", "demo04", "demo05", "demo06"] as const) {
      const instances = getSceneAssetInstances(sceneId);
      expect(instances.length).toBeGreaterThan(0);
      expect(instances.every((instance) => instance.objectId.trim().length > 0)).toBe(true);
      expect(instances.every((instance) => getAssetDefinition(instance.assetId).uri.endsWith(".glb"))).toBe(true);
    }
  });

  it("uses real pharmacy and fruit objects", () => {
    expect(getSceneAssetInstances("demo05").map((item) => item.assetId)).toEqual(
      expect.arrayContaining(["pill-bottle", "box", "scanner", "tray"]),
    );
    expect(getSceneAssetInstances("demo06").some((item) => item.assetId === "apple")).toBe(true);
  });
});
