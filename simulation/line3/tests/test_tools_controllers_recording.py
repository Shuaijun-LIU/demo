from __future__ import annotations

from pathlib import Path

import numpy as np
import pytest

from line3.controllers import CartesianDlsController, JointPositionController
from line3.env import Line3Env
from line3.recording import EpisodeRecorder, load_episode
from line3.tools import ToolDock


def test_tool_dock_enforces_single_attachment_and_explicit_return() -> None:
    dock = ToolDock(("probe", "driver"))
    dock.attach("arm1", "probe")

    with pytest.raises(RuntimeError, match="attached"):
        dock.attach("arm2", "probe")
    with pytest.raises(RuntimeError, match="already carries"):
        dock.attach("arm1", "driver")

    dock.detach("arm1", "probe")
    assert dock.tool_owner("probe") is None
    assert dock.arm_tool("arm1") is None


def test_joint_and_cartesian_controllers_clip_to_declared_limits() -> None:
    joint = JointPositionController(max_delta=0.05)
    result = joint.compute(np.zeros(8), np.ones(8), lower=np.full(8, -0.5), upper=np.full(8, 0.5))
    np.testing.assert_allclose(result, np.full(8, 0.05))

    cartesian = CartesianDlsController(damping=0.1, max_joint_delta=0.04)
    jacobian = np.eye(6, 7)
    delta = cartesian.compute(jacobian, np.ones(6))
    assert delta.shape == (7,)
    assert np.max(np.abs(delta)) <= 0.04


def test_episode_round_trip_preserves_observations_actions_events_and_manifest(tmp_path: Path) -> None:
    env = Line3Env(arm_count=3)
    observation, info = env.reset(seed=20260812)
    recorder = EpisodeRecorder(task_id="demo01", seed=20260812, asset_manifest_hash="a" * 64)
    for index in range(4):
        action = np.full(24, 0.01 * index, dtype=np.float32)
        recorder.append(observation, action, event={"stage": index}, oracle_predicates={"done": False})
        observation, _, _, _, info = env.step(action)
    recorder.finish(info={"state_hash": info["state_hash"]})
    target = recorder.save(tmp_path / "episode.npz")

    loaded = load_episode(target)
    assert loaded.metadata["task_id"] == "demo01"
    assert loaded.metadata["asset_manifest_hash"] == "a" * 64
    assert loaded.actions.shape == (4, 24)
    assert loaded.observations["joint_position"].shape == (4, 3, 8)
    assert loaded.events == tuple({"stage": index} for index in range(4))
    assert loaded.file_sha256 == recorder.file_sha256
