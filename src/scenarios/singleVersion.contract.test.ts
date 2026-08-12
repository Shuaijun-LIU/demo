import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const productSources = [
  "src/app/App.tsx",
  "src/app/SceneViewport.tsx",
  "src/app/urlState.ts",
  "src/scenarios/sceneFiles.ts",
] as const;

describe("single-version showroom repository", () => {
  it("contains no Line 2 runtime directories", () => {
    expect(existsSync("public/scenarios/line2")).toBe(false);
    expect(existsSync("public/assets/line2")).toBe(false);
  });

  it("contains no version routing in the product entry points", () => {
    for (const file of productSources) {
      expect(readFileSync(file, "utf8")).not.toMatch(/line2|Line 2/i);
    }
  });
});
