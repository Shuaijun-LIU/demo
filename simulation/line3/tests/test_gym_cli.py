from __future__ import annotations

from pathlib import Path

import mujoco
import gymnasium as gym

import line3
from line3.cli import main
from line3.tasks.registry import GYM_IDS, TASK_IDS, make_env


def test_six_gymnasium_ids_are_registered_and_step() -> None:
    assert line3.register_gymnasium_envs() == GYM_IDS
    for gym_id, task_id in zip(GYM_IDS, TASK_IDS):
        env = gym.make(gym_id)
        observation, info = env.reset(seed=20260812)
        assert env.observation_space.contains(observation)
        assert info["task_id"] == task_id
        observation, _, terminated, truncated, info = env.step(env.unwrapped.expert_action())
        assert env.observation_space.contains(observation)
        assert not terminated
        assert not truncated
        env.close()


def test_every_task_manifest_is_explicit_about_arms_stages_fault_and_objects() -> None:
    for task_id in TASK_IDS:
        env = make_env(task_id)
        manifest = env.task_manifest()
        assert f'"task_id": "{task_id}"' in manifest
        assert f'"arm_count": {env.arm_count}' in manifest
        assert env.fault_code in manifest
        assert '"stages"' in manifest
        assert '"objects"' in manifest


def test_cli_exports_a_portable_scene_to_an_arbitrary_directory(tmp_path: Path) -> None:
    target = tmp_path / "nested" / "demo01.xml"

    assert main(["export-mjcf", "demo01", str(target)]) == 0
    model = mujoco.MjModel.from_xml_path(str(target))

    assert model.nq == 27
    assert model.nu == 24
