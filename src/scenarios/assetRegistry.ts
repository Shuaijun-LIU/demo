import type { ScenarioId } from "../app/urlState";

export type AssetId =
  | "battery"
  | "box"
  | "tray"
  | "scanner"
  | "electronic-scale"
  | "screwdriver"
  | "pill-bottle"
  | "apple";

type Vec3 = readonly [number, number, number];

export interface AssetDefinition {
  readonly id: AssetId;
  readonly uri: string;
  readonly source: "RoboTwin2";
  readonly license: "MIT";
  readonly bytes: number;
  readonly sha256: string;
}

export interface AssetInstance {
  readonly id: string;
  readonly assetId: AssetId;
  readonly objectId: string;
  readonly role: "task-object" | "tool" | "fixture";
  readonly position: Vec3;
  readonly rotation: Vec3;
  readonly scale: Vec3;
}

export const ASSET_REGISTRY: Readonly<Record<AssetId, AssetDefinition>> = {
  battery: {
    id: "battery",
    uri: "assets/line2/battery.glb",
    source: "RoboTwin2",
    license: "MIT",
    bytes: 19_480,
    sha256: "bc245f5e8c61b8802fc2cc39f5bbae4cd922f19494a5b4a7b8de308d36139fcd",
  },
  box: {
    id: "box",
    uri: "assets/line2/box.glb",
    source: "RoboTwin2",
    license: "MIT",
    bytes: 13_132,
    sha256: "74a45e5ea7cde9a2cae63ef5aab5ea3b461f55c336650fd580264c09c8b3200a",
  },
  tray: {
    id: "tray",
    uri: "assets/line2/tray.glb",
    source: "RoboTwin2",
    license: "MIT",
    bytes: 222_048,
    sha256: "77d926998fb1a58ea2c2951be3221fff561c5e8df5af317fa0dd23bdbd6b7373",
  },
  scanner: {
    id: "scanner",
    uri: "assets/line2/scanner.glb",
    source: "RoboTwin2",
    license: "MIT",
    bytes: 268_572,
    sha256: "8fb8f2076e95ec412281ae5b55a0113e93caecc387916fa7fdc88c6fbd3432ad",
  },
  "electronic-scale": {
    id: "electronic-scale",
    uri: "assets/line2/electronic-scale.glb",
    source: "RoboTwin2",
    license: "MIT",
    bytes: 186_376,
    sha256: "397518ae577b2fc78b0bec72a0fae3137bd8669bab40efd738dc95dd113a9b8e",
  },
  screwdriver: {
    id: "screwdriver",
    uri: "assets/line2/screwdriver.glb",
    source: "RoboTwin2",
    license: "MIT",
    bytes: 1_699_896,
    sha256: "800789c5692a9b791b37b2a06f9caf1f069a6a1266e07bd48683548f7d737c8b",
  },
  "pill-bottle": {
    id: "pill-bottle",
    uri: "assets/line2/pill-bottle.glb",
    source: "RoboTwin2",
    license: "MIT",
    bytes: 442_732,
    sha256: "1a52f483221d8b41955ad77ccd76fc945d932ef054a04d8d053466dadad1a5aa",
  },
  apple: {
    id: "apple",
    uri: "assets/line2/apple.glb",
    source: "RoboTwin2",
    license: "MIT",
    bytes: 1_671_820,
    sha256: "80dcf0a725dd720073862af880e8830a52355b73050d5d6573712b41c17dcb8f",
  },
};

const zero: Vec3 = [0, 0, 0];
const one: Vec3 = [1, 1, 1];

const SCENE_ASSETS: Readonly<Record<ScenarioId, readonly AssetInstance[]>> = {
  demo01: [
    { id: "p1-real", assetId: "battery", objectId: "P1", role: "task-object", position: [-0.72, -0.32, 0.81], rotation: zero, scale: one },
    { id: "p2-real", assetId: "battery", objectId: "P2", role: "task-object", position: [-0.55, -0.32, 0.81], rotation: zero, scale: one },
    { id: "p3-real", assetId: "battery", objectId: "P3", role: "task-object", position: [-0.38, -0.32, 0.81], rotation: zero, scale: one },
    { id: "feed-tray-real", assetId: "tray", objectId: "FEED-TRAY", role: "fixture", position: [-0.56, -0.27, 0.76], rotation: zero, scale: [0.55, 0.55, 0.55] },
    { id: "scanner-real", assetId: "scanner", objectId: "SKU-SCANNER", role: "tool", position: [-0.14, -0.43, 0.82], rotation: [0, 0, 1.57], scale: [0.65, 0.65, 0.65] },
  ],
  demo02: [
    { id: "s0-real", assetId: "box", objectId: "S0", role: "task-object", position: [-0.82, -0.23, 0.82], rotation: zero, scale: [0.7, 0.55, 0.45] },
    { id: "s1-real", assetId: "box", objectId: "S1", role: "task-object", position: [0.82, 0.24, 0.82], rotation: [0, 0, 3.14], scale: [0.7, 0.55, 0.45] },
    { id: "inspection-real", assetId: "scanner", objectId: "PATH-SCANNER", role: "tool", position: [0.54, 0.47, 0.86], rotation: [0, 0, -1.57], scale: [0.5, 0.5, 0.5] },
  ],
  demo03: [
    { id: "carton-blue-real", assetId: "box", objectId: "BLUE-CARTON", role: "task-object", position: [0.02, 0.19, 0.86], rotation: zero, scale: [1.2, 0.9, 0.8] },
    { id: "food-a-real", assetId: "apple", objectId: "K1-FOOD-A", role: "task-object", position: [-0.75, -0.22, 0.82], rotation: zero, scale: [0.7, 0.7, 0.7] },
    { id: "scale-real", assetId: "electronic-scale", objectId: "ORDER-SCALE", role: "fixture", position: [0.61, -0.18, 0.78], rotation: zero, scale: [0.75, 0.75, 0.75] },
    { id: "output-tray-real", assetId: "tray", objectId: "PASS-OUTPUT", role: "fixture", position: [0.75, -0.48, 0.7], rotation: zero, scale: [0.55, 0.55, 0.55] },
  ],
  demo04: [
    { id: "driver-real", assetId: "screwdriver", objectId: "ELECTRIC-DRIVER", role: "tool", position: [0.72, -0.38, 0.9], rotation: [0, 0, 0], scale: [0.8, 0.8, 0.8] },
    { id: "fastener-box-real", assetId: "box", objectId: "FASTENER-TRAY", role: "fixture", position: [-0.68, 0.38, 0.8], rotation: zero, scale: [0.9, 0.7, 0.45] },
    { id: "seam-scanner-real", assetId: "scanner", objectId: "SEAM-SCANNER", role: "tool", position: [0.58, 0.38, 0.84], rotation: [0, 0, -1.57], scale: [0.5, 0.5, 0.5] },
  ],
  demo05: [
    { id: "a2-real", assetId: "pill-bottle", objectId: "A2", role: "task-object", position: [-0.28, 0.25, 0.72], rotation: zero, scale: [0.75, 0.75, 0.75] },
    { id: "b2-real", assetId: "pill-bottle", objectId: "B2", role: "task-object", position: [0.78, 0.25, 0.72], rotation: zero, scale: [0.75, 0.75, 0.75] },
    { id: "c1-real", assetId: "pill-bottle", objectId: "C1", role: "task-object", position: [0.78, 0.25, 1.19], rotation: zero, scale: [0.75, 0.75, 0.75] },
    { id: "b3-real", assetId: "box", objectId: "B3", role: "task-object", position: [0.26, 0.25, 1.08], rotation: zero, scale: [0.8, 0.6, 0.6] },
    { id: "rx-scanner-real", assetId: "scanner", objectId: "RX-SCANNER", role: "tool", position: [0.02, -0.47, 0.86], rotation: [0, 0, 1.57], scale: [0.55, 0.55, 0.55] },
    { id: "rx-tray-real", assetId: "tray", objectId: "RX-MERGE", role: "fixture", position: [-0.22, -0.22, 0.78], rotation: zero, scale: [0.5, 0.5, 0.5] },
  ],
  demo06: [
    { id: "g1-real", assetId: "apple", objectId: "G1", role: "task-object", position: [-0.78, -0.3, 0.84], rotation: zero, scale: [0.8, 0.8, 0.8] },
    { id: "g2-real", assetId: "apple", objectId: "G2", role: "task-object", position: [-0.59, -0.3, 0.84], rotation: [0, 0, 0.5], scale: [0.72, 0.72, 0.72] },
    { id: "g3-real", assetId: "apple", objectId: "G3", role: "task-object", position: [-0.4, -0.3, 0.84], rotation: [0, 0, 1.0], scale: [0.82, 0.82, 0.82] },
    { id: "g5-real", assetId: "apple", objectId: "G5", role: "task-object", position: [-0.55, -0.12, 0.84], rotation: [0, 0, 1.7], scale: [0.84, 0.84, 0.84] },
    { id: "fruit-tray-real", assetId: "tray", objectId: "FRUIT-TRAY", role: "fixture", position: [-0.6, -0.23, 0.77], rotation: zero, scale: [0.6, 0.6, 0.6] },
    { id: "product-tray-real", assetId: "tray", objectId: "PRODUCT-TRAY", role: "fixture", position: [0.6, 0.4, 0.77], rotation: zero, scale: [0.45, 0.45, 0.45] },
  ],
};

export function getAssetDefinition(id: AssetId): AssetDefinition {
  return ASSET_REGISTRY[id];
}

export function getSceneAssetInstances(sceneId: ScenarioId): readonly AssetInstance[] {
  return SCENE_ASSETS[sceneId];
}
