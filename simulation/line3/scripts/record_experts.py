from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

from line3.assets.registry import ASSET_REGISTRY
from line3.recording import EpisodeRecorder
from line3.tasks.registry import TASK_IDS, make_env


def asset_manifest_hash() -> str:
    payload = [asset.__dict__ for asset in ASSET_REGISTRY]
    return hashlib.sha256(json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser(description="Record deterministic expert episodes")
    parser.add_argument("--seed", type=int, default=20260812)
    parser.add_argument("--output-dir", type=Path, default=Path("artifacts/experts"))
    args = parser.parse_args()
    manifest_hash = asset_manifest_hash()
    for task_id in TASK_IDS:
        env = make_env(task_id)
        observation, info = env.reset(seed=args.seed)
        recorder = EpisodeRecorder(task_id=task_id, seed=args.seed, asset_manifest_hash=manifest_hash)
        terminated = truncated = False
        while not (terminated or truncated):
            action = env.expert_action()
            oracle = env.oracle()
            recorder.append(
                observation,
                action,
                event={"stage": env.stage_name, "fault_count": env.business_fault_count},
                oracle_predicates=oracle.predicates,
            )
            observation, _, terminated, truncated, info = env.step(action)
        recorder.finish(info=info)
        target = recorder.save(args.output_dir / f"{task_id}-seed-{args.seed}.npz")
        print(f"{task_id}: {target} sha256={recorder.file_sha256}")
        env.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
