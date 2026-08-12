from line3.tasks.base import MultiPandaTaskEnv, TaskDefinition, obj, stage


class Demo01Env(MultiPandaTaskEnv):
    definition = TaskDefinition(
        task_id="demo01",
        title="Electronics inspection and functional test",
        arm_count=3,
        stages=(
            stage("singulate", 1),
            stage("scan", 1),
            stage("handoff", 1, 2),
            stage("flip_front", 2),
            stage("flip_back", 2),
            stage("probe_test", 3),
            stage("route", 1, 3),
            stage("return_safe", 1, 2, 3),
        ),
        objects=(
            obj("esd_tray", "box", (0.24, 0.16, 0.025), (-0.34, 0.04, 0.735), (0.18, 0.23, 0.25, 1.0)),
            obj("part_p1", "box", (0.045, 0.032, 0.012), (-0.37, 0.03, 0.78), (0.30, 0.34, 0.35, 1.0)),
            obj("part_p2", "box", (0.045, 0.032, 0.012), (-0.27, 0.03, 0.78), (0.35, 0.37, 0.36, 1.0)),
            obj("part_p3", "box", (0.045, 0.032, 0.012), (-0.17, 0.03, 0.78), (0.40, 0.34, 0.28, 1.0)),
            obj("flip_fixture", "cylinder", (0.12, 0.025), (0.05, 0.05, 0.74), (0.24, 0.27, 0.28, 1.0)),
            obj("scanner", "box", (0.05, 0.035, 0.08), (0.32, 0.30, 0.79), (0.25, 0.31, 0.33, 1.0)),
            obj("probe_socket", "box", (0.11, 0.08, 0.02), (0.33, 0.02, 0.74), (0.31, 0.28, 0.23, 1.0)),
            obj("ng_tray", "box", (0.15, 0.10, 0.02), (0.42, -0.25, 0.73), (0.38, 0.24, 0.22, 1.0)),
        ),
        fault_code="missing_rear_marker",
        fault_stage="flip_back",
        recovery_stage="route",
        success_predicate="routing_correct",
        final_predicates=("probe_docked", "five_parts_classified"),
        metric_values={"inventory_conserved": 1.0, "classified_parts": 5.0},
    )
