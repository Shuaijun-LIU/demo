from __future__ import annotations

import math
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from pathlib import Path

import mujoco


@dataclass(frozen=True)
class PandaSpec:
    prefix: str
    pose: tuple[float, float, float]


@dataclass(frozen=True)
class SceneGeom:
    name: str
    geom_type: str
    size: tuple[float, ...]
    pos: tuple[float, float, float]
    rgba: tuple[float, float, float, float]
    mocap: bool
    collidable: bool


class MenagerieMjcfBuilder:
    """Assembles independently-prefixed MuJoCo Menagerie Franka Panda models."""

    def __init__(self, model_name: str = "multi-panda-line3") -> None:
        self.model_name = model_name
        self._pandas: list[PandaSpec] = []
        self._scene_geoms: list[SceneGeom] = []
        self._project_root = Path(__file__).resolve().parents[3]
        self._panda_xml = self._project_root / "public/models/franka/panda.xml"
        self._mesh_dir = self._panda_xml.parent / "assets"
        if not self._panda_xml.is_file():
            raise FileNotFoundError(f"MuJoCo Menagerie Panda model is missing: {self._panda_xml}")

    def add_panda(self, prefix: str, pose: tuple[float, float, float]) -> None:
        if not prefix or not prefix.endswith("_"):
            raise ValueError("Panda prefix must be non-empty and end with '_'")
        if any(spec.prefix == prefix for spec in self._pandas):
            raise ValueError(f"Duplicate Panda prefix: {prefix}")
        if len(pose) != 3 or not all(math.isfinite(value) for value in pose):
            raise ValueError("Panda pose must be finite (x, y, yaw)")
        self._pandas.append(PandaSpec(prefix, pose))

    def add_scene_geom(
        self,
        name: str,
        *,
        geom_type: str,
        size: tuple[float, ...],
        pos: tuple[float, float, float],
        rgba: tuple[float, float, float, float],
        mocap: bool = False,
        collidable: bool = True,
    ) -> None:
        if not name or name in {geom.name for geom in self._scene_geoms}:
            raise ValueError(f"scene geom name must be non-empty and unique: {name}")
        expected_sizes = {"box": 3, "sphere": 1, "cylinder": 2, "capsule": 2}
        if geom_type not in expected_sizes or len(size) != expected_sizes[geom_type]:
            raise ValueError(f"invalid {geom_type} size")
        values = (*size, *pos, *rgba)
        if not all(math.isfinite(value) for value in values) or any(value <= 0 for value in size):
            raise ValueError("scene geom parameters must be finite with positive sizes")
        self._scene_geoms.append(SceneGeom(name, geom_type, size, pos, rgba, mocap, collidable))

    def _build_tree(self, panda_file: str) -> ET.Element:
        if not self._pandas:
            raise ValueError("At least one Panda must be added")
        root = ET.Element("mujoco", {"model": self.model_name})
        ET.SubElement(root, "compiler", {"angle": "radian", "autolimits": "true"})
        ET.SubElement(root, "option", {"timestep": "0.002", "integrator": "implicitfast", "gravity": "0 0 -9.81"})
        asset = ET.SubElement(root, "asset")
        ET.SubElement(asset, "model", {"name": "panda", "file": panda_file})
        world = ET.SubElement(root, "worldbody")
        ET.SubElement(
            world,
            "geom",
            {
                "name": "floor",
                "type": "plane",
                "size": "4 4 0.1",
                "rgba": "0.18 0.2 0.21 1",
                "friction": "0.8 0.02 0.002",
            },
        )
        ET.SubElement(world, "light", {"pos": "0 -1 4", "diffuse": "0.8 0.8 0.8"})
        ET.SubElement(
            world,
            "camera",
            {"name": "overview", "pos": "3.2 -3.2 2.8", "xyaxes": "0.707 0.707 0 -0.36 0.36 0.86"},
        )
        for panda in self._pandas:
            x, y, yaw = panda.pose
            frame = ET.SubElement(world, "frame", {"pos": f"{x} {y} 0", "euler": f"0 0 {yaw}"})
            ET.SubElement(frame, "attach", {"model": "panda", "body": "link0", "prefix": panda.prefix})
        for scene_geom in self._scene_geoms:
            attributes = {
                "name": f"scene_{scene_geom.name}",
                "pos": " ".join(str(value) for value in scene_geom.pos),
            }
            if scene_geom.mocap:
                attributes["mocap"] = "true"
            body = ET.SubElement(world, "body", attributes)
            ET.SubElement(
                body,
                "geom",
                {
                    "name": scene_geom.name,
                    "type": scene_geom.geom_type,
                    "size": " ".join(str(value) for value in scene_geom.size),
                    "rgba": " ".join(str(value) for value in scene_geom.rgba),
                    "contype": "1" if scene_geom.collidable else "0",
                    "conaffinity": "1" if scene_geom.collidable else "0",
                    "friction": "0.8 0.02 0.002",
                },
            )
        return root

    def to_xml_string(self, *, panda_file: str | None = None) -> str:
        model_file = panda_file or str(self._panda_xml)
        return ET.tostring(self._build_tree(model_file), encoding="unicode")

    def _spec(self) -> mujoco.MjSpec:
        spec = mujoco.MjSpec.from_string(self.to_xml_string())
        for panda in self._pandas:
            spec.body(f"{panda.prefix}hand").add_site(
                name=f"{panda.prefix}ee_site",
                pos=(0.0, 0.0, 0.14),
                size=(0.012,),
                rgba=(0.45, 0.47, 0.43, 1.0),
            )
        for mesh in spec.meshes:
            mesh.file = str(self._mesh_dir / mesh.file)
        return spec

    def compile(self) -> mujoco.MjModel:
        return self._spec().compile()

    def export_xml_string(self, *, mesh_dir: str) -> str:
        """Expand attached Pandas and emit repository-portable mesh references."""
        spec = self._spec()
        for mesh in spec.meshes:
            mesh.file = Path(mesh.file).name
        spec.compiler.meshdir = mesh_dir
        return spec.to_xml()

    def collect_names(self) -> tuple[str, ...]:
        model = self.compile()
        names: list[str] = []
        for object_type, count in (
            (mujoco.mjtObj.mjOBJ_BODY, model.nbody),
            (mujoco.mjtObj.mjOBJ_JOINT, model.njnt),
            (mujoco.mjtObj.mjOBJ_SITE, model.nsite),
            (mujoco.mjtObj.mjOBJ_ACTUATOR, model.nu),
            (mujoco.mjtObj.mjOBJ_GEOM, model.ngeom),
        ):
            for index in range(count):
                name = mujoco.mj_id2name(model, object_type, index)
                if name and name != "world":
                    names.append(name)
        return tuple(names)
