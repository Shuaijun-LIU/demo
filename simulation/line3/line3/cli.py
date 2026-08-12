from __future__ import annotations

import argparse
import json
from pathlib import Path

from line3.tasks.registry import TASK_IDS, make_env


def _run(task_id: str, seed: int) -> dict[str, object]:
    env = make_env(task_id)
    env.reset(seed=seed)
    terminated = truncated = False
    info: dict[str, object] = {}
    while not (terminated or truncated):
        _, _, terminated, truncated, info = env.step(env.expert_action())
    oracle = env.oracle()
    steps = env.get_state().step_count
    fault_code = env.fault_code
    business_fault_count = env.business_fault_count
    env.close()
    return {
        "task_id": task_id,
        "seed": seed,
        "success": oracle.success,
        "steps": steps,
        "fault_code": fault_code,
        "business_fault_count": business_fault_count,
        "predicates": dict(oracle.predicates),
        "metrics": dict(oracle.metrics),
        "reason_code": info["reason_code"],
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="line3", description="Native MuJoCo multi-Panda task suite")
    subparsers = parser.add_subparsers(dest="command", required=True)

    list_parser = subparsers.add_parser("list", help="list the six tasks")
    list_parser.set_defaults(command="list")

    run_parser = subparsers.add_parser("run", help="run a deterministic expert episode")
    run_parser.add_argument("task_id", choices=TASK_IDS)
    run_parser.add_argument("--seed", type=int, default=20260812)

    export_parser = subparsers.add_parser("export-mjcf", help="export one compiled task scene")
    export_parser.add_argument("task_id", choices=TASK_IDS)
    export_parser.add_argument("target", type=Path)

    args = parser.parse_args(argv)
    if args.command == "list":
        for task_id in TASK_IDS:
            env = make_env(task_id)
            print(f"{task_id}\t{env.definition.title}\t{env.arm_count} arms")
            env.close()
        return 0
    if args.command == "export-mjcf":
        env = make_env(args.task_id)
        args.target.parent.mkdir(parents=True, exist_ok=True)
        relative_mesh_dir = Path(__file__).resolve().parents[3] / "public" / "models" / "franka" / "assets"
        args.target.write_text(env._builder.export_xml_string(mesh_dir=str(relative_mesh_dir)), encoding="utf-8")
        print(args.target)
        env.close()
        return 0
    print(json.dumps(_run(args.task_id, args.seed), ensure_ascii=False, sort_keys=True, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
