from __future__ import annotations

from pathlib import Path

from line3.tasks.registry import TASK_IDS, make_env


def main() -> int:
    target_root = Path(__file__).parents[1] / "line3" / "models"
    for task_id in TASK_IDS:
        env = make_env(task_id)
        target = target_root / task_id / "scene.xml"
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(env._builder.export_xml_string(mesh_dir="../../../../../public/models/franka/assets"), encoding="utf-8")
        (target.parent / "manifest.json").write_text(env.task_manifest() + "\n", encoding="utf-8")
        print(target)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
