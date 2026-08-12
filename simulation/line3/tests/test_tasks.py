from __future__ import annotations

import numpy as np
import pytest

from line3.tasks.registry import TASK_IDS, make_env


EXPECTED = {
    "demo01": {"arm_count": 3, "fault": "missing_rear_marker", "predicate": "routing_correct"},
    "demo02": {"arm_count": 4, "fault": "c2_latch_offset", "predicate": "routing_rms_ok"},
    "demo03": {"arm_count": 3, "fault": "missing_date_label", "predicate": "carton_routing_correct"},
    "demo04": {"arm_count": 4, "fault": "f2_switch_miss", "predicate": "fasteners_verified"},
    "demo05": {"arm_count": 4, "fault": "wrong_drug_b3", "predicate": "orders_correct"},
    "demo06": {"arm_count": 3, "fault": "g5_pit_retained", "predicate": "fruit_routing_correct"},
}


def run_expert(env, *, limit: int = 240):
    terminated = truncated = False
    info = {}
    for _ in range(limit):
        _, _, terminated, truncated, info = env.step(env.expert_action())
        if terminated or truncated:
            break
    return terminated, truncated, info


@pytest.mark.parametrize("task_id", TASK_IDS)
def test_each_task_runs_a_continuous_expert_to_a_typed_oracle(task_id: str) -> None:
    env = make_env(task_id)
    observation, info = env.reset(seed=20260812)

    assert env.arm_count == EXPECTED[task_id]["arm_count"]
    assert env.action_space.shape == (env.arm_count * 8,)
    assert env.observation_space.contains(observation)
    assert observation["task_sensor"].shape == (16,)
    assert info["task_id"] == task_id

    terminated, truncated, info = run_expert(env)
    oracle = env.oracle()

    assert terminated and not truncated, info
    assert oracle.success
    assert oracle.predicates[EXPECTED[task_id]["predicate"]]
    assert env.business_fault_count == 1
    assert env.fault_code == EXPECTED[task_id]["fault"]
    assert sum('"kind":"business_fault"' in event for event in env.get_state().trace) == 1
    assert info["reason_code"] == "success"


@pytest.mark.parametrize("task_id", TASK_IDS)
def test_every_declared_arm_is_necessary_for_task_completion(task_id: str) -> None:
    baseline = make_env(task_id)
    for arm_index in range(1, baseline.arm_count + 1):
        env = make_env(task_id, horizon=80)
        env.reset(seed=20260812, options={"disabled_arms": [f"arm{arm_index}"]})
        terminated, truncated, _ = run_expert(env, limit=80)

        assert not terminated
        assert truncated
        assert not env.oracle().success


@pytest.mark.parametrize("task_id", TASK_IDS)
def test_task_graph_and_physics_restore_exactly(task_id: str) -> None:
    env = make_env(task_id)
    env.reset(seed=99)
    for _ in range(8):
        env.step(env.expert_action())
    checkpoint = env.get_state()
    action = env.expert_action()
    expected_observation, expected_reward, expected_terminated, expected_truncated, expected_info = env.step(action)

    env.set_state(checkpoint)
    actual_observation, actual_reward, actual_terminated, actual_truncated, actual_info = env.step(action)

    for key in expected_observation:
        np.testing.assert_array_equal(expected_observation[key], actual_observation[key])
    assert (expected_reward, expected_terminated, expected_truncated) == (
        actual_reward,
        actual_terminated,
        actual_truncated,
    )
    assert expected_info == actual_info


def test_task_specific_oracles_expose_business_metrics() -> None:
    expected_metrics = {
        "demo01": {"inventory_conserved", "duration_seconds"},
        "demo02": {"routing_rms_m", "normalized_tension"},
        "demo03": {"inventory_conserved", "duration_seconds"},
        "demo04": {"plate_angle_deg", "datum_error_m"},
        "demo05": {"sealed_packages", "inventory_conserved"},
        "demo06": {"pits_recovered", "max_grip_force_n"},
    }
    for task_id in TASK_IDS:
        env = make_env(task_id)
        env.reset(seed=20260812)
        terminated, _, _ = run_expert(env)
        assert terminated
        assert expected_metrics[task_id] <= set(env.oracle().metrics)
