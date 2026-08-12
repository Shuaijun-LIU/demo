import { describe, expect, it } from "vitest";
import { readDemoLocation, writeDemoLocation } from "./urlState";

describe("static showroom URL state", () => {
  it("defaults to Demo01", () => {
    expect(readDemoLocation("")).toEqual({ sceneId: "demo01" });
  });

  it("restores a valid scene and ignores a legacy line parameter", () => {
    expect(readDemoLocation("?line=line2&scene=demo06")).toEqual({ sceneId: "demo06" });
  });

  it("falls back from an invalid scene value", () => {
    expect(readDemoLocation("?scene=demo99")).toEqual({ sceneId: "demo01" });
  });

  it("writes a stable scene-only query", () => {
    expect(writeDemoLocation("demo05")).toBe("?scene=demo05");
  });
});
