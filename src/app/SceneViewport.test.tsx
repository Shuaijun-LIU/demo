import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createHomeControls } from "./SceneViewport";

describe("static scene viewport", () => {
  it("keeps MuJoCo paused and contains no motion runtime", () => {
    const source = readFileSync(resolve("src/app/SceneViewport.tsx"), "utf8");
    expect(source).toMatch(/<MujocoCanvas[\s\S]*?\bpaused\b/);
    expect(source).toContain("speed={0}");
    expect(source).not.toContain("ScenarioMotionController");
    expect(source).not.toContain("PreviewMode");
    expect(source).not.toContain("data-line-id");
  });

  it("uses the requested near-black charcoal environment", () => {
    const source = readFileSync(resolve("src/app/SceneViewport.tsx"), "utf8");
    expect(source).toContain('#252a2e');
    expect(source).not.toContain('#d2d5d4');
    expect(source).not.toContain('#ececea');
    expect(source).not.toContain('#07111d');
    expect(source).not.toContain('#68d8ff');
  });

  it("includes each Panda gripper actuator between adjacent arm controls", () => {
    const controls = createHomeControls(3);

    expect(controls).toHaveLength(24);
    expect(controls.slice(0, 8)).toEqual([0, -0.7, 0, -2.2, 0, 1.6, 0.78, 255]);
    expect(controls.slice(8, 16)).toEqual([0, -0.7, 0, -2.2, 0, 1.6, 0.78, 255]);
  });
});
