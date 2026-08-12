from __future__ import annotations

import argparse

from line3.assets.registry import ASSET_REGISTRY, AssetRegistry, validate_drop_settle


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate Line3 asset provenance and collision proxies")
    parser.add_argument("--all", action="store_true", help="also run native MuJoCo drop/settle checks")
    args = parser.parse_args()
    registry = AssetRegistry(ASSET_REGISTRY)
    metadata = registry.validate()
    files = registry.verify_files()
    if not metadata.valid or not files.valid:
        for issue in (*metadata.issues, *files.issues):
            print(f"FAIL {issue}")
        return 1
    for asset in registry.assets():
        suffix = ""
        if args.all:
            result = validate_drop_settle(asset, duration_seconds=2.0)
            if not result.is_finite:
                print(f"FAIL {asset.asset_id}: drop/settle diverged")
                return 1
            suffix = f" settle_z={result.final_height_m:.4f}m peak={result.peak_speed_m_s:.3f}m/s"
        print(f"PASS {asset.asset_id} sha256={asset.sha256}{suffix}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
