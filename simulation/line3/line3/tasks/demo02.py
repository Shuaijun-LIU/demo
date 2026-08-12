from line3.tasks.base import MultiPandaTaskEnv, TaskDefinition, obj, stage


class Demo02Env(MultiPandaTaskEnv):
    definition = TaskDefinition(
        task_id="demo02",
        title="Automotive harness routing and clip recovery",
        arm_count=4,
        stages=(
            stage("seat_s0", 1),
            stage("acquire_three_anchors", 1, 2, 3),
            stage("route_main", 1, 2, 3),
            stage("seat_s1", 2),
            stage("press_c1", 4, 1, 2, 3),
            stage("press_c2", 4, 1, 2, 3),
            stage("recover_c2", 4, 1, 2, 3),
            stage("press_c3", 4, 1, 2, 3),
            stage("branch_b1", 3, 4),
            stage("inspect", 2, 4),
            stage("release", 1, 2, 3, 4),
            stage("return_safe", 1, 2, 3, 4),
        ),
        objects=(
            obj("routing_board", "box", (0.55, 0.36, 0.025), (0.0, 0.03, 0.73), (0.30, 0.31, 0.31, 1.0)),
            obj("connector_s0", "box", (0.05, 0.035, 0.025), (-0.43, -0.14, 0.78), (0.38, 0.32, 0.22, 1.0)),
            obj("connector_s1", "box", (0.05, 0.035, 0.025), (0.43, 0.16, 0.78), (0.38, 0.32, 0.22, 1.0)),
            obj("cable_main", "capsule", (0.018, 0.34), (0.0, 0.01, 0.78), (0.16, 0.18, 0.18, 1.0)),
            obj("clip_c1", "cylinder", (0.035, 0.025), (-0.20, 0.0, 0.79), (0.36, 0.37, 0.34, 1.0)),
            obj("clip_c2", "cylinder", (0.035, 0.025), (0.0, 0.05, 0.79), (0.42, 0.29, 0.22, 1.0)),
            obj("clip_c3", "cylinder", (0.035, 0.025), (0.20, 0.10, 0.79), (0.36, 0.37, 0.34, 1.0)),
            obj("clip_press", "cylinder", (0.035, 0.10), (0.48, -0.28, 0.82), (0.24, 0.28, 0.29, 1.0)),
        ),
        fault_code="c2_latch_offset",
        fault_stage="press_c2",
        recovery_stage="recover_c2",
        success_predicate="routing_rms_ok",
        final_predicates=("connectors_locked", "clips_latched", "anchors_released"),
        metric_values={"routing_rms_m": 0.014, "normalized_tension": 0.51},
    )
