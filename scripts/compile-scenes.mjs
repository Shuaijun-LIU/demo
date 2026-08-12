import loadMujoco from "mujoco-js";
import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, join, relative } from "node:path";

const publicRoot = new URL("../public/", import.meta.url).pathname;
const sceneIds = ["demo01", "demo02", "demo03", "demo04", "demo05", "demo06"];

async function collectFiles(directory) {
  const result = [];
  for (const name of await readdir(directory)) {
    const path = join(directory, name);
    if ((await stat(path)).isDirectory()) result.push(...await collectFiles(path));
    else result.push(path);
  }
  return result;
}

function ensureDirectory(mujoco, file) {
  let current = "/working";
  for (const part of dirname(file).split("/")) {
    if (part === ".") continue;
    current += `/${part}`;
    try { mujoco.FS.mkdir(current); } catch { /* already exists */ }
  }
}

const mujoco = await loadMujoco();
try { mujoco.FS.mkdir("/working"); } catch { /* already exists */ }
for (const path of await collectFiles(publicRoot)) {
  const file = relative(publicRoot, path);
  ensureDirectory(mujoco, file);
  mujoco.FS.writeFile(`/working/${file}`, new Uint8Array(await readFile(path)));
}

for (const line of ["line1", "line2"]) {
  for (const sceneId of sceneIds) {
    const prefix = line === "line2" ? "line2/" : "";
    const model = mujoco.MjModel.loadFromXML(`/working/scenarios/${prefix}${sceneId}/scene.xml`);
    const data = new mujoco.MjData(model);
    console.log(`${line}/${sceneId}: nq=${model.nq} nv=${model.nv} nu=${model.nu} bodies=${model.nbody}`);
    data.delete();
    model.delete();
  }
}
