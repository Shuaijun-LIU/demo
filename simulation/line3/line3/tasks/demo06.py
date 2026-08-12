from line3.tasks.base import MultiPandaTaskEnv, TaskDefinition, obj, stage


class Demo06Env(MultiPandaTaskEnv):
    definition = TaskDefinition(
        task_id="demo06",
        title="Fruit inspection, pitting and rework",
        arm_count=3,
        stages=(
            stage("pick_rotate_inspect", 1),
            stage("classify_g2", 1),
            stage("classify_g4", 1),
            stage("handoff", 1, 2),
            stage("orient", 2),
            stage("pit_g1_g3", 2, 3),
            stage("pit_g5", 2, 3),
            stage("rework_g5", 1, 2, 3),
            stage("repit_g5", 2, 3),
            stage("reverify", 1, 3),
            stage("pack", 1, 2, 3),
            stage("return_safe", 1, 2, 3),
        ),
        objects=(
            obj("fruit_g1", "sphere", (0.055,), (-0.40, -0.05, 0.77), (0.45, 0.20, 0.15, 1.0)),
            obj("fruit_g2", "sphere", (0.052,), (-0.27, -0.05, 0.77), (0.36, 0.38, 0.20, 1.0)),
            obj("fruit_g3", "sphere", (0.055,), (-0.14, -0.05, 0.77), (0.46, 0.21, 0.16, 1.0)),
            obj("fruit_g4", "sphere", (0.054,), (-0.01, -0.05, 0.77), (0.34, 0.22, 0.18, 1.0)),
            obj("fruit_g5", "sphere", (0.056,), (0.12, -0.05, 0.77), (0.45, 0.20, 0.15, 1.0)),
            obj("inspection_turntable", "cylinder", (0.16, 0.025), (0.0, 0.22, 0.74), (0.28, 0.29, 0.29, 1.0)),
            obj("pitting_head", "cylinder", (0.035, 0.13), (0.34, 0.20, 0.86), (0.25, 0.28, 0.29, 1.0)),
            obj("product_tray", "box", (0.22, 0.16, 0.025), (0.36, -0.22, 0.74), (0.31, 0.30, 0.25, 1.0)),
        ),
        fault_code="g5_pit_retained",
        fault_stage="pit_g5",
        recovery_stage="repit_g5",
        success_predicate="fruit_routing_correct",
        final_predicates=("four_fruits_pitted", "quality_classes_preserved"),
        metric_values={"pits_recovered": 4.0, "max_grip_force_n": 7.2},
    )
