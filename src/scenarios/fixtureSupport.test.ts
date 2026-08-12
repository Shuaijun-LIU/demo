import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type Bounds = {
  min: [number, number, number];
  max: [number, number, number];
};

function attribute(tag: string, name: string) {
  const match = tag.match(new RegExp(`\\b${name}="([^"]+)"`));
  if (!match) throw new Error(`Missing ${name} in ${tag}`);
  return match[1];
}

function geomBounds(xml: string, name: string): Bounds {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const tag = xml.match(new RegExp(`<geom\\b[^>]*\\bname="${escapedName}"[^>]*/>`))?.[0];
  if (!tag) throw new Error(`Missing geom ${name}`);

  const pos = attribute(tag, "pos").split(/\s+/).map(Number);
  const size = attribute(tag, "size").split(/\s+/).map(Number);
  const type = attribute(tag, "type");
  const half = type === "box" ? size : type === "cylinder" ? [size[0], size[0], size[1]] : null;
  if (!half || pos.length !== 3 || half.length !== 3) throw new Error(`Unsupported geom ${name}`);

  return {
    min: [pos[0] - half[0], pos[1] - half[1], pos[2] - half[2]],
    max: [pos[0] + half[0], pos[1] + half[1], pos[2] + half[2]],
  };
}

function overlapsOnAxis(first: Bounds, second: Bounds, axis: 0 | 1 | 2) {
  return Math.min(first.max[axis], second.max[axis]) - Math.max(first.min[axis], second.min[axis]) > 1e-6;
}

function touchesFromBelow(lower: Bounds, upper: Bounds) {
  return (
    overlapsOnAxis(lower, upper, 0) &&
    overlapsOnAxis(lower, upper, 1) &&
    Math.abs(lower.max[2] - upper.min[2]) <= 1e-6
  );
}

function overlaps(first: Bounds, second: Bounds) {
  return ([0, 1, 2] as const).every(
    (axis) => Math.min(first.max[axis], second.max[axis]) - Math.max(first.min[axis], second.min[axis]) >= -1e-6,
  );
}

function scene(sceneId: "demo03" | "demo06") {
  return readFileSync(resolve(`public/scenarios/${sceneId}/scene.xml`), "utf8");
}

describe("static fixture support chains", () => {
  it("supports the Demo 03 scale display continuously from the scale", () => {
    const xml = scene("demo03");
    const scale = geomBounds(xml, "scale");
    const post = geomBounds(xml, "scale_display_post");
    const display = geomBounds(xml, "scale_display");

    expect(touchesFromBelow(scale, post)).toBe(true);
    expect(touchesFromBelow(post, display)).toBe(true);
  });

  it("supports the Demo 06 pitter bridge and both heads from the base", () => {
    const xml = scene("demo06");
    const base = geomBounds(xml, "pitter_base");
    const bridge = geomBounds(xml, "pitter_bridge");

    for (const name of ["pitter_frame_post_left", "pitter_frame_post_right"] as const) {
      const post = geomBounds(xml, name);
      expect(touchesFromBelow(base, post)).toBe(true);
      expect(touchesFromBelow(post, bridge)).toBe(true);
    }

    expect(overlaps(bridge, geomBounds(xml, "pitter_head_1"))).toBe(true);
    expect(overlaps(bridge, geomBounds(xml, "pitter_head_2"))).toBe(true);
  });
});
