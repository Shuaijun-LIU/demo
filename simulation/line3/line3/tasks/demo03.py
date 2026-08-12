from line3.tasks.base import MultiPandaTaskEnv, TaskDefinition, obj, stage


class Demo03Env(MultiPandaTaskEnv):
    definition = TaskDefinition(
        task_id="demo03",
        title="Flexible food cartoning and label inspection",
        arm_count=3,
        stages=(
            stage("supply", 1),
            stage("select_carton", 2),
            stage("erect", 2),
            stage("hold", 2),
            stage("load", 1, 3),
            stage("close", 2, 3),
            stage("label", 3),
            stage("weigh", 1, 3),
            stage("inspect", 2, 3),
            stage("route", 1, 2, 3),
            stage("return_safe", 1, 2, 3),
        ),
        objects=(
            obj("food_a", "sphere", (0.055,), (-0.38, -0.08, 0.76), (0.46, 0.20, 0.15, 1.0)),
            obj("food_b", "capsule", (0.035, 0.08), (-0.26, -0.08, 0.78), (0.50, 0.38, 0.15, 1.0)),
            obj("blue_carton", "box", (0.075, 0.055, 0.09), (0.03, 0.02, 0.80), (0.22, 0.30, 0.34, 1.0)),
            obj("yellow_carton", "box", (0.075, 0.055, 0.09), (0.20, 0.02, 0.80), (0.48, 0.39, 0.21, 1.0)),
            obj("carton_fixture", "box", (0.18, 0.14, 0.03), (0.10, 0.20, 0.74), (0.29, 0.30, 0.29, 1.0)),
            obj("date_label", "box", (0.045, 0.025, 0.003), (0.36, 0.22, 0.73), (0.72, 0.70, 0.62, 1.0)),
            obj("scale", "box", (0.14, 0.11, 0.025), (0.39, -0.13, 0.74), (0.25, 0.28, 0.29, 1.0)),
            obj("ng_conveyor", "box", (0.25, 0.10, 0.025), (0.0, -0.34, 0.73), (0.35, 0.23, 0.20, 1.0)),
        ),
        fault_code="missing_date_label",
        fault_stage="inspect",
        recovery_stage="route",
        success_predicate="carton_routing_correct",
        final_predicates=("weight_tolerance_ok", "contents_contained"),
        metric_values={"inventory_conserved": 1.0, "weight_error_kg": 0.006},
    )
