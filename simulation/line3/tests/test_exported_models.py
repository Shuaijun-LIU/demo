from __future__ import annotations

from pathlib import Path

import mujoco

from line3.tasks.registry import TASK_IDS, make_env


def test_six_portable_mjcf_exports_compile_with_real_menagerie_pandas() -> None:
    model_root = Path(__file__).parents[1] / "line3" / "models"
    for task_id in TASK_IDS:
        env = make_env(task_id)
        scene_path = model_root / task_id / "scene.xml"
        model = mujoco.MjModel.from_xml_path(str(scene_path.resolve()))

        assert model.nq == env.arm_count * 9
        assert model.nu == env.arm_count * 8
        assert model.nsite >= env.arm_count
        assert all(
            mujoco.mj_name2id(model, mujoco.mjtObj.mjOBJ_SITE, f"arm{index}_ee_site") >= 0
            for index in range(1, env.arm_count + 1)
        )
        assert any(model.geom(index).dataid >= 0 for index in range(model.ngeom))
        env.close()
