from __future__ import annotations

import argparse
from pathlib import Path

import imageio.v2 as imageio

from line3.tasks.registry import TASK_IDS, make_env


def main() -> int:
    parser = argparse.ArgumentParser(description="Render six native MuJoCo expert episodes")
    parser.add_argument("--seed", type=int, default=20260812)
    parser.add_argument("--output-dir", type=Path, default=Path("artifacts/videos"))
    parser.add_argument("--fps", type=int, default=25)
    args = parser.parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)
    for task_id in TASK_IDS:
        env = make_env(task_id, render_mode="rgb_array")
        env.reset(seed=args.seed)
        frames = [env.render()]
        terminated = truncated = False
        while not (terminated or truncated):
            _, _, terminated, truncated, _ = env.step(env.expert_action())
            frames.append(env.render())
        target = args.output_dir / f"{task_id}.mp4"
        imageio.mimsave(target, frames, fps=args.fps, macro_block_size=16)
        print(f"{task_id}: {target} frames={len(frames)} success={env.oracle().success}")
        env.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
