from __future__ import annotations

import mujoco
import numpy as np
import pytest

from line3.env import Line3Env
from line3.mjcf_builder import MjcfBuilder


def test_four_pandas_compile_with_unique_names_and_expected_control_shape() -> None:
    builder = MjcfBuilder(model_name="four-panda-contract")
    poses = [(-0.9, -0.6, 0.0), (0.9, -0.6, 1.57), (0.9, 0.6, 3.14), (-0.9, 0.6, -1.57)]
    for index, pose in enumerate(poses, start=1):
        builder.add_panda(f"arm{index}_", pose)

    model = builder.compile()
    names = builder.collect_names()

    assert model.nu == 32
    assert model.nq == 36
    assert len(names) == len(set(names))
    assert all(name.startswith("arm") or name == "floor" for name in names)
    assert model.ngeom == 325
    assert model.nbody == 45
    assert all(
        mujoco.mj_name2id(model, mujoco.mjtObj.mjOBJ_SITE, f"arm{index}_ee_site") >= 0
        for index in range(1, 5)
    )
    assert any(model.geom(index).dataid >= 0 for index in range(model.ngeom))


def test_real_menagerie_finger_positions_are_aggregated_into_one_gripper_channel() -> None:
    env = Line3Env(arm_count=3)
    observation, _ = env.reset(seed=7)
    assert observation["joint_position"].shape == (3, 8)
    np.testing.assert_allclose(observation["joint_position"][:, 7], 0.08)
    assert env.model.nq == 27


def test_task_objects_have_native_collision_and_move_during_continuous_control() -> None:
    from line3.tasks.registry import make_env

    env = make_env("demo01")
    observation, _ = env.reset(seed=20260812)
    geom_id = mujoco.mj_name2id(env.model, mujoco.mjtObj.mjOBJ_GEOM, "part_p1")
    initial_pose = observation["object_pose"].copy()

    assert env.model.geom_contype[geom_id] != 0
    for _ in range(4):
        observation, *_ = env.step(env.expert_action())
    assert not np.array_equal(observation["object_pose"], initial_pose)


def test_large_task_fixture_remains_fixed_after_first_stage_completion() -> None:
    from line3.tasks.registry import make_env

    env = make_env("demo02")
    observation, _ = env.reset(seed=20260812)
    routing_board_pose = observation["object_pose"][0].copy()
    while env.stage_name == "seat_s0":
        observation, *_ = env.step(env.expert_action())

    np.testing.assert_array_equal(observation["object_pose"][0], routing_board_pose)


def test_env_validates_action_and_returns_structured_observation() -> None:
    env = Line3Env(arm_count=3, horizon=4)
    observation, info = env.reset(seed=20260812)

    assert env.action_space.shape == (24,)
    assert env.observation_space.contains(observation)
    assert observation["joint_position"].shape == (3, 8)
    assert observation["end_effector_pose"].shape == (3, 7)
    assert info["reason_code"] == "reset"

    with pytest.raises(ValueError, match="shape"):
        env.step(np.zeros(8, dtype=np.float32))
    with pytest.raises(ValueError, match="finite"):
        env.step(np.full(24, np.nan, dtype=np.float32))

    _, _, terminated, truncated, step_info = env.step(np.zeros(24, dtype=np.float32))
    assert not terminated
    assert not truncated
    assert step_info["reason_code"] == "running"

    for _ in range(3):
        _, _, _, truncated, step_info = env.step(np.zeros(24, dtype=np.float32))
    assert truncated
    assert step_info["reason_code"] == "time_limit"


def test_reset_with_same_seed_reproduces_observation_and_state_hash() -> None:
    env = Line3Env(arm_count=4)
    first_observation, first_info = env.reset(seed=20260812)
    second_observation, second_info = env.reset(seed=20260812)

    np.testing.assert_array_equal(first_observation["joint_position"], second_observation["joint_position"])
    np.testing.assert_array_equal(first_observation["object_pose"], second_observation["object_pose"])
    assert first_info["state_hash"] == second_info["state_hash"]
