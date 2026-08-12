import { describe, expect, it } from "vitest";
import { ASSET_CALIBRATION, PAYLOAD_INSTANCE_IDS } from "./assetRegistry.calibrated";

describe("RoboTwin source calibration", () => {
  it("uses author-provided model scales in a Z-up workcell", () => {
    expect(ASSET_CALIBRATION.box.sourceScale).toEqual([0.05, 0.05, 0.05]);
    expect(ASSET_CALIBRATION.tray.sourceScale).toEqual([0.16, 0.16, 0.16]);
    expect(ASSET_CALIBRATION.scanner.sourceScale).toEqual([0.08, 0.08, 0.08]);
    expect(ASSET_CALIBRATION.screwdriver.sourceScale).toEqual([0.095, 0.095, 0.095]);
    expect(ASSET_CALIBRATION["pill-bottle"].sourceScale).toEqual([0.08, 0.08, 0.08]);
    expect(Object.values(ASSET_CALIBRATION).every((asset) => asset.upAxis === "y")).toBe(true);
  });

  it("selects exactly one physical payload asset per scene", () => {
    expect(Object.keys(PAYLOAD_INSTANCE_IDS)).toHaveLength(6);
    expect(new Set(Object.values(PAYLOAD_INSTANCE_IDS)).size).toBe(6);
  });
});
