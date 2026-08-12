import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const pandaPath = resolve("public/models/franka/panda.xml");

describe("web Franka asset budget", () => {
  it("uses one compact full-shape visual mesh per link", () => {
    const xml = readFileSync(pandaPath, "utf8");
    const builder = readFileSync(resolve("scripts/build-web-franka-meshes.py"), "utf8");
    const files = Array.from(xml.matchAll(/<mesh(?: name="[^"]+")? file="([^"]+)"/g), (match) => match[1]);

    expect(files).toHaveLength(22);
    expect(files).not.toContain("link0_0.obj");
    expect(files).not.toContain("link6_16.obj");
    expect(files).toContain("web_link0.obj");
    expect(files).toContain("web_link7.obj");
    expect(files).toContain("web_finger.obj");
    expect(xml).toContain('<geom mesh="web_link0" material="off_white" class="visual"/>');
    expect(xml).toContain('<geom mesh="web_link7" material="white" class="visual"/>');
    expect(builder).not.toContain("simplify_quadric_decimation");
    expect(builder).not.toContain("import trimesh");
  });
});
