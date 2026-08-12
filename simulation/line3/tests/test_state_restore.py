from __future__ import annotations

import numpy as np

from line3.env import Line3Env


def test_checkpoint_restores_physics_task_and_random_state_exactly() -> None:
    env = Line3Env(arm_count=3, frame_skip=3)
    env.reset(seed=20260812)
    warmup = np.linspace(-0.25, 0.25, 24, dtype=np.float32)
    for _ in range(20):
        env.step(warmup)

    checkpoint = env.get_state()
    action = np.linspace(0.2, -0.2, 24, dtype=np.float32)
    expected_observation, _, _, _, expected_info = env.step(action)

    env.set_state(checkpoint)
    actual_observation, _, _, _, actual_info = env.step(action)

    for key in expected_observation:
        np.testing.assert_array_equal(expected_observation[key], actual_observation[key])
    assert expected_info["state_hash"] == actual_info["state_hash"]
    assert expected_info["trace_hash"] == actual_info["trace_hash"]


def test_state_snapshot_is_detached_from_live_environment() -> None:
    env = Line3Env(arm_count=3)
    env.reset(seed=7)
    snapshot = env.get_state()
    original_qpos = snapshot.qpos.copy()

    env.step(np.ones(24, dtype=np.float32) * 0.1)

    np.testing.assert_array_equal(snapshot.qpos, original_qpos)
    assert not np.shares_memory(snapshot.qpos, env.data.qpos)
