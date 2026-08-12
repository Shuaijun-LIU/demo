import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("static scene viewport", () => {
  it("keeps MuJoCo paused and contains no motion runtime", () => {
    const source = readFileSync(resolve("src/app/SceneViewport.tsx"), "utf8");
    expect(source).toMatch(/<MujocoCanvas[\s\S]*?\bpaused\b/);
    expect(source).toContain("speed={0}");
    expect(source).not.toContain("ScenarioMotionController");
    expect(source).not.toContain("PreviewMode");
    expect(source).not.toContain("data-line-id");
  });

  it("uses a light neutral environment", () => {
    const source = readFileSync(resolve("src/app/SceneViewport.tsx"), "utf8");
    expect(source).toContain('#ececea');
    expect(source).not.toContain('#07111d');
    expect(source).not.toContain('#68d8ff');
  });
});
