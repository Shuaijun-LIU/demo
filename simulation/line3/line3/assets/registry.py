from __future__ import annotations

import hashlib
import math
from dataclasses import dataclass
from pathlib import Path

import mujoco
import numpy as np


@dataclass(frozen=True)
class AssetSpec:
    asset_id: str
    source_path: str
    sha256: str
    spdx_license: str
    source_url: str
    units: str
    extents_m: tuple[float, float, float]
    mass_kg: float
    diagonal_inertia_kg_m2: tuple[float, float, float]
    friction: tuple[float, float, float]
    collision_method: str


@dataclass(frozen=True)
class RegistryReport:
    valid: bool
    issues: tuple[str, ...]
    redistributable_count: int
    total_mass_kg: float


@dataclass(frozen=True)
class FileVerificationReport:
    valid: bool
    issues: tuple[str, ...]


@dataclass(frozen=True)
class DropSettleResult:
    model: mujoco.MjModel
    final_height_m: float
    peak_speed_m_s: float
    is_finite: bool


def _box_inertia(mass: float, extents: tuple[float, float, float]) -> tuple[float, float, float]:
    x, y, z = extents
    return (
        mass * (y * y + z * z) / 12.0,
        mass * (x * x + z * z) / 12.0,
        mass * (x * x + y * y) / 12.0,
    )


def _asset(
    asset_id: str,
    sha256: str,
    extents: tuple[float, float, float],
    mass: float,
    collision_method: str,
) -> AssetSpec:
    return AssetSpec(
        asset_id=asset_id,
        source_path=f"public/assets/line2/{asset_id}.glb",
        sha256=sha256,
        spdx_license="MIT",
        source_url="https://github.com/RoboTwin-Platform/RoboTwin",
        units="m",
        extents_m=extents,
        mass_kg=mass,
        diagonal_inertia_kg_m2=_box_inertia(mass, extents),
        friction=(0.8, 0.02, 0.002),
        collision_method=collision_method,
    )


ASSET_REGISTRY: tuple[AssetSpec, ...] = (
    _asset("apple", "80dcf0a725dd720073862af880e8830a52355b73050d5d6573712b41c17dcb8f", (0.09, 0.09, 0.10), 0.18, "convex-hull"),
    _asset("battery", "bc245f5e8c61b8802fc2cc39f5bbae4cd922f19494a5b4a7b8de308d36139fcd", (0.12, 0.08, 0.05), 0.12, "box"),
    _asset("box", "74a45e5ea7cde9a2cae63ef5aab5ea3b461f55c336650fd580264c09c8b3200a", (0.18, 0.12, 0.08), 0.10, "box"),
    _asset("electronic-scale", "397518ae577b2fc78b0bec72a0fae3137bd8669bab40efd738dc95dd113a9b8e", (0.24, 0.18, 0.06), 0.90, "box"),
    _asset("pill-bottle", "1a52f483221d8b41955ad77ccd76fc945d932ef054a04d8d053466dadad1a5aa", (0.065, 0.065, 0.13), 0.06, "capsule"),
    _asset("scanner", "8fb8f2076e95ec412281ae5b55a0113e93caecc387916fa7fdc88c6fbd3432ad", (0.16, 0.08, 0.16), 0.25, "box"),
    _asset("screwdriver", "800789c5692a9b791b37b2a06f9caf1f069a6a1266e07bd48683548f7d737c8b", (0.04, 0.04, 0.22), 0.30, "capsule"),
    _asset("tray", "77d926998fb1a58ea2c2951be3221fff561c5e8df5af317fa0dd23bdbd6b7373", (0.42, 0.28, 0.045), 0.50, "box"),
)


class AssetRegistry:
    def __init__(self, assets: tuple[AssetSpec, ...], *, project_root: Path | None = None) -> None:
        self._assets = tuple(assets)
        self._project_root = project_root or Path(__file__).resolve().parents[4]

    def ids(self) -> tuple[str, ...]:
        return tuple(asset.asset_id for asset in self._assets)

    def assets(self) -> tuple[AssetSpec, ...]:
        return self._assets

    def get(self, asset_id: str) -> AssetSpec:
        try:
            return next(asset for asset in self._assets if asset.asset_id == asset_id)
        except StopIteration as error:
            raise KeyError(asset_id) from error

    def validate(self) -> RegistryReport:
        issues: list[str] = []
        if len(set(self.ids())) != len(self._assets):
            issues.append("asset IDs must be unique")
        for asset in self._assets:
            if len(asset.sha256) != 64 or any(char not in "0123456789abcdef" for char in asset.sha256):
                issues.append(f"{asset.asset_id}: invalid sha256")
            if asset.units != "m":
                issues.append(f"{asset.asset_id}: units must be metres")
            if asset.spdx_license != "MIT":
                issues.append(f"{asset.asset_id}: asset is not approved for redistribution")
            numeric = (*asset.extents_m, asset.mass_kg, *asset.diagonal_inertia_kg_m2, *asset.friction)
            if not all(math.isfinite(value) and value >= 0 for value in numeric):
                issues.append(f"{asset.asset_id}: non-finite or negative physical metadata")
            if any(value <= 0 for value in (*asset.extents_m, asset.mass_kg, *asset.diagonal_inertia_kg_m2)):
                issues.append(f"{asset.asset_id}: physical dimensions, mass and inertia must be positive")
            if asset.collision_method not in {"box", "capsule", "convex-hull"}:
                issues.append(f"{asset.asset_id}: unsupported collision method")
        return RegistryReport(
            valid=not issues,
            issues=tuple(issues),
            redistributable_count=sum(asset.spdx_license == "MIT" for asset in self._assets),
            total_mass_kg=sum(asset.mass_kg for asset in self._assets),
        )

    def verify_files(self) -> FileVerificationReport:
        issues: list[str] = []
        for asset in self._assets:
            path = self._project_root / asset.source_path
            if not path.is_file():
                issues.append(f"{asset.asset_id}: missing {path}")
                continue
            digest = hashlib.sha256(path.read_bytes()).hexdigest()
            if digest != asset.sha256:
                issues.append(f"{asset.asset_id}: sha256 mismatch")
        return FileVerificationReport(valid=not issues, issues=tuple(issues))


def validate_drop_settle(asset: AssetSpec, *, duration_seconds: float) -> DropSettleResult:
    if duration_seconds <= 0:
        raise ValueError("duration_seconds must be positive")
    x, y, z = (value / 2.0 for value in asset.extents_m)
    if asset.collision_method == "capsule":
        radius = min(x, y)
        geom = f'<geom type="capsule" size="{radius} {max(radius, z - radius)}" mass="{asset.mass_kg}" friction="{asset.friction[0]} {asset.friction[1]} {asset.friction[2]}"/>'
    else:
        geom = f'<geom type="box" size="{x} {y} {z}" mass="{asset.mass_kg}" friction="{asset.friction[0]} {asset.friction[1]} {asset.friction[2]}"/>'
    xml = f"""
    <mujoco model="drop-{asset.asset_id}">
      <option timestep="0.002" gravity="0 0 -9.81" integrator="implicitfast"/>
      <worldbody>
        <geom type="plane" size="2 2 0.1" friction="1 0.02 0.002"/>
        <body pos="0 0 0.6"><freejoint/>{geom}</body>
      </worldbody>
    </mujoco>
    """
    model = mujoco.MjModel.from_xml_string(xml)
    data = mujoco.MjData(model)
    peak_speed = 0.0
    for _ in range(math.ceil(duration_seconds / model.opt.timestep)):
        mujoco.mj_step(model, data)
        peak_speed = max(peak_speed, float(np.linalg.norm(data.qvel[:3])))
    finite = bool(np.isfinite(data.qpos).all() and np.isfinite(data.qvel).all())
    return DropSettleResult(model=model, final_height_m=float(data.qpos[2]), peak_speed_m_s=peak_speed, is_finite=finite)
