import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("bright minimal showroom theme", () => {
  const css = readFileSync(resolve("src/ui/theme/base.css"), "utf8");

  it("uses a light off-white page without legacy neon colors", () => {
    expect(css).toContain("color-scheme: light");
    expect(css).toContain("#f2f2ef");
    expect(css).not.toContain("#050b12");
    expect(css).not.toContain("#5ee2ff");
  });

  it("contains no line-specific or forced desktop layout", () => {
    expect(css).not.toContain('[data-line="line2"]');
    expect(css).not.toContain("min-width: 1180px");
    expect(css).toContain("@media (max-width: 860px)");
  });
});
