import loadMujoco from "mujoco-js";
import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, join, relative } from "node:path";

const publicRoot = new URL("../public/", import.meta.url).pathname;
const sceneIds = ["demo01", "demo02", "demo03", "demo04", "demo05", "demo06"];
const pandaHomeControls = [0, -0.7, 0, -2.2, 0, 1.6, 0.78, 255];
const penetrationTolerance = -0.0001;

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

function getName(model, addresses, id, fallback) {
  const address = addresses[id];
  if (address === undefined || address < 0) return `${fallback}_${id}`;
  let name = "";
  for (let cursor = address; model.names[cursor] !== 0; cursor += 1) {
    name += String.fromCharCode(model.names[cursor]);
  }
  return name || `${fallback}_${id}`;
}

function describeGeom(model, geomId) {
  const geomName = getName(model, model.name_geomadr, geomId, "geom");
  const bodyId = model.geom_bodyid[geomId];
  const bodyName = getName(model, model.name_bodyadr, bodyId, "body");
  return `${bodyName}/${geomName}`;
}

function applyViewerHomePose(model, data) {
  if (model.nu % pandaHomeControls.length !== 0) {
    throw new Error(`Expected eight controls per Panda, received nu=${model.nu}`);
  }

  for (let actuatorId = 0; actuatorId < model.nu; actuatorId += 1) {
    const value = pandaHomeControls[actuatorId % pandaHomeControls.length];
    data.ctrl[actuatorId] = value;

    const transmissionType = model.actuator_trntype[actuatorId];
    const jointId = model.actuator_trnid[2 * actuatorId];
    if ((transmissionType === 0 || transmissionType === 1) && jointId >= 0 && jointId < model.njnt) {
      data.qpos[model.jnt_qposadr[jointId]] = value;
    }
  }
}

const mujoco = await loadMujoco();
try { mujoco.FS.mkdir("/working"); } catch { /* already exists */ }

for (const path of await collectFiles(publicRoot)) {
  const file = relative(publicRoot, path);
  ensureDirectory(mujoco, file);
  mujoco.FS.writeFile(`/working/${file}`, new Uint8Array(await readFile(path)));
}

let failed = false;

for (const sceneId of sceneIds) {
  const model = mujoco.MjModel.loadFromXML(`/working/scenarios/${sceneId}/scene.xml`);
  const data = new mujoco.MjData(model);

  try {
    applyViewerHomePose(model, data);
    mujoco.mj_forward(model, data);

    const penetrations = [];
    for (let contactId = 0; contactId < data.ncon; contactId += 1) {
      const contact = data.contact.get(contactId);
      if (contact && contact.dist < penetrationTolerance) {
        penetrations.push({
          first: describeGeom(model, contact.geom1),
          second: describeGeom(model, contact.geom2),
          depthMm: Math.abs(contact.dist) * 1000,
        });
      }
    }

    if (penetrations.length === 0) {
      console.log(`${sceneId}: PASS (${model.nu / 8} Panda, ${data.ncon} near contacts, no penetration > 0.1 mm)`);
    } else {
      failed = true;
      console.error(`${sceneId}: FAIL (${penetrations.length} penetrations > 0.1 mm)`);
      for (const contact of penetrations) {
        console.error(`  ${contact.depthMm.toFixed(2)} mm: ${contact.first} <> ${contact.second}`);
      }
    }
  } finally {
    data.delete();
    model.delete();
  }
}

if (failed) process.exitCode = 1;
