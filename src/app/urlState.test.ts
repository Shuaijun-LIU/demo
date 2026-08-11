import { describe, expect, it } from "vitest";
import { readDemoLocation, writeDemoLocation } from "./urlState";

describe("demo URL state", () => {
  it("defaults to Line2 Demo01", () => {
    expect(readDemoLocation("")).toEqual({ lineId: "line2", sceneId: "demo01" });
  });

  it("restores a valid shared Line1 link", () => {
    expect(readDemoLocation("?line=line1&scene=demo06")).toEqual({
      lineId: "line1",
      sceneId: "demo06",
    });
  });

  it("falls back from invalid line and scene values", () => {
    expect(readDemoLocation("?line=preview&scene=demo99")).toEqual({
      lineId: "line2",
      sceneId: "demo01",
    });
  });

  it("writes a stable shareable query", () => {
    expect(writeDemoLocation({ lineId: "line2", sceneId: "demo05" })).toBe(
      "?line=line2&scene=demo05",
    );
  });
});
