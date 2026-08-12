import { expect, it } from "vitest";
import { RepeatWrapping, type DataTexture } from "three";
import * as checkerFloorModule from "./MujocoCheckerFloor";

it("builds two alternating muted-blue tiles for the white-lined floor", () => {
  const createTexture = Reflect.get(checkerFloorModule, "createMujocoCheckerTexture") as
    | (() => DataTexture)
    | undefined;

  expect(createTexture).toBeTypeOf("function");
  if (!createTexture) return;

  const texture = createTexture();
  expect(texture.image.data).not.toBeNull();
  if (!texture.image.data) throw new Error("checker texture data is missing");
  expect(Array.from(texture.image.data)).toEqual([
    91, 130, 166, 255,
    136, 169, 198, 255,
    136, 169, 198, 255,
    91, 130, 166, 255,
  ]);
  expect(texture.wrapS).toBe(RepeatWrapping);
  expect(texture.wrapT).toBe(RepeatWrapping);
  expect(texture.repeat.toArray()).toEqual([14, 14]);
  texture.dispose();
});
