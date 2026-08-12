import type { ScenarioId } from "../app/urlState";
import type { AssetId } from "./assetRegistry";

type Vec3 = readonly [number, number, number];

export interface AssetCalibration {
  readonly sourceScale: Vec3;
  readonly upAxis: "y";
}

export const ASSET_CALIBRATION: Readonly<Record<AssetId, AssetCalibration>> = {
  battery: { sourceScale: [0.04, 0.04, 0.04], upAxis: "y" },
  box: { sourceScale: [0.05, 0.05, 0.05], upAxis: "y" },
  tray: { sourceScale: [0.16, 0.16, 0.16], upAxis: "y" },
  scanner: { sourceScale: [0.08, 0.08, 0.08], upAxis: "y" },
  "electronic-scale": { sourceScale: [0.08, 0.08, 0.08], upAxis: "y" },
  screwdriver: { sourceScale: [0.095, 0.095, 0.095], upAxis: "y" },
  "pill-bottle": { sourceScale: [0.08, 0.08, 0.08], upAxis: "y" },
  apple: { sourceScale: [0.7, 0.7, 0.7], upAxis: "y" },
};

export const PAYLOAD_INSTANCE_IDS: Readonly<Record<ScenarioId, string>> = {
  demo01: "p1-real",
  demo02: "s0-real",
  demo03: "food-a-real",
  demo04: "driver-real",
  demo05: "a1-real",
  demo06: "g1-real",
};
