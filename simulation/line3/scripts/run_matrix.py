from __future__ import annotations

import argparse
import json
import time
from pathlib import Path

import numpy as np

from line3.tasks.registry import TASK_IDS, make_env


def run_episode(env, seed: int) -> dict[str, object]:
    env.reset(seed=seed)
    started = time.perf_counter()
    terminated = truncated = False
    info: dict[str, object] = {}
    peak_contact_force_n = 0.0
    while not (terminated or truncated):
        observation, _, terminated, truncated, info = env.step(env.expert_action())
        peak_contact_force_n = max(peak_contact_force_n, float(np.max(observation["contact_force"])))
    wall_seconds = time.perf_counter() - started
    oracle = env.oracle()
    result = {
        "seed": seed,
        "success": oracle.success,
        "steps": env.get_state().step_count,
        "sim_seconds": float(env.data.time),
        "wall_seconds": wall_seconds,
        "realtime_factor": float(env.data.time) / max(wall_seconds, 1e-12),
        "fault_count": env.business_fault_count,
        "reason_code": info["reason_code"],
        "metrics": dict(oracle.metrics),
        "peak_contact_force_n": peak_contact_force_n,
    }
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description="Run the Line3 fixed-seed expert matrix")
    parser.add_argument("--episodes", type=int, default=100)
    parser.add_argument("--seed-start", type=int, default=20260812)
    parser.add_argument("--output", type=Path, default=Path("artifacts/matrix-report.json"))
    args = parser.parse_args()
    if args.episodes <= 0:
        raise SystemExit("--episodes must be positive")

    report: dict[str, object] = {
        "schema_version": 1,
        "episodes_per_task": args.episodes,
        "seed_start": args.seed_start,
        "tasks": {},
    }
    for task_id in TASK_IDS:
        env = make_env(task_id)
        episodes = [run_episode(env, args.seed_start + offset) for offset in range(args.episodes)]
        env.close()
        successes = sum(bool(episode["success"]) for episode in episodes)
        task_report = {
            "successes": successes,
            "failures": args.episodes - successes,
            "success_rate": successes / args.episodes,
            "mean_steps": float(np.mean([episode["steps"] for episode in episodes])),
            "mean_realtime_factor": float(np.mean([episode["realtime_factor"] for episode in episodes])),
            "business_faults": sum(int(episode["fault_count"]) for episode in episodes),
            "episodes": episodes,
        }
        report["tasks"][task_id] = task_report
        print(
            f"{task_id}: {successes}/{args.episodes} "
            f"mean_steps={task_report['mean_steps']:.1f} rtf={task_report['mean_realtime_factor']:.2f}"
        )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, sort_keys=True, indent=2) + "\n", encoding="utf-8")
    return int(any(task["failures"] for task in report["tasks"].values()))


if __name__ == "__main__":
    raise SystemExit(main())
