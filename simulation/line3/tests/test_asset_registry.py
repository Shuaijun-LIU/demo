from __future__ import annotations

from pathlib import Path

import mujoco

from line3.assets.registry import ASSET_REGISTRY, AssetRegistry, validate_drop_settle


REQUIRED_ASSETS = {
    "apple",
    "battery",
    "box",
    "electronic-scale",
    "pill-bottle",
    "scanner",
    "screwdriver",
    "tray",
}


def test_public_assets_have_reproducible_license_and_physics_metadata() -> None:
    registry = AssetRegistry(ASSET_REGISTRY)
    report = registry.validate()

    assert set(registry.ids()) == REQUIRED_ASSETS
    assert report.valid
    assert report.redistributable_count == 8
    assert report.total_mass_kg > 0.5
    for asset in registry.assets():
        assert asset.source_path.startswith("public/assets/line2/")
        assert len(asset.sha256) == 64
        assert asset.spdx_license == "MIT"
        assert asset.units == "m"
        assert all(value > 0 for value in asset.extents_m)
        assert asset.mass_kg > 0
        assert all(value > 0 for value in asset.diagonal_inertia_kg_m2)
        assert len(asset.friction) == 3
        assert asset.collision_method in {"box", "capsule", "convex-hull"}


def test_registry_detects_tampered_visual_assets() -> None:
    project_root = Path(__file__).parents[3]
    registry = AssetRegistry(ASSET_REGISTRY, project_root=project_root)

    assert registry.verify_files().valid


def test_each_collision_proxy_settles_in_native_mujoco() -> None:
    for asset in AssetRegistry(ASSET_REGISTRY).assets():
        result = validate_drop_settle(asset, duration_seconds=2.0)
        assert isinstance(result.model, mujoco.MjModel)
        assert result.final_height_m >= asset.extents_m[2] * 0.45
        assert result.peak_speed_m_s < 8.0
        assert result.is_finite
