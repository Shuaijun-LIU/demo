import { readFileSync, statSync } from "node:fs";
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
    expect(files).toContain("web_link0.msh");
    expect(files).toContain("web_link7.msh");
    expect(files).toContain("web_finger.msh");
    expect(xml).toContain('<geom mesh="web_link0" material="off_white" class="visual"/>');
    expect(xml).toContain('<geom mesh="web_link7" material="white" class="visual"/>');
    expect(builder).not.toContain("simplify_quadric_decimation");
    expect(builder).not.toContain("import trimesh");

    const binaryWebMeshes = files.filter((file) => file.startsWith("web_") && file.endsWith(".msh"));
    const totalBytes = binaryWebMeshes.reduce(
      (sum, file) => sum + statSync(resolve("public/models/franka/assets", file)).size,
      0,
    );
    expect(binaryWebMeshes).toHaveLength(10);
    expect(totalBytes).toBeLessThan(5_000_000);
  });
});
