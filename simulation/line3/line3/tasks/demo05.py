from line3.tasks.base import MultiPandaTaskEnv, TaskDefinition, obj, stage


class Demo05Env(MultiPandaTaskEnv):
    definition = TaskDefinition(
        task_id="demo05",
        title="Pharmacy verification and gated packaging",
        arm_count=4,
        stages=(
            stage("pick_a_and_bc", 1, 2, 3),
            stage("lock_rx_merge", 1, 2, 3),
            stage("scan_count", 3),
            stage("detect_b3", 3),
            stage("return_b3", 3),
            stage("repick_b1", 2, 3),
            stage("rescan", 3),
            stage("pass_gate", 3, 4),
            stage("package", 1, 2, 4),
            stage("deliver", 4),
            stage("return_safe", 1, 2, 3, 4),
        ),
        objects=(
            obj("medicine_a1", "box", (0.045, 0.025, 0.075), (-0.42, 0.08, 0.79), (0.38, 0.31, 0.25, 1.0)),
            obj("medicine_a2", "box", (0.045, 0.025, 0.075), (-0.30, 0.08, 0.79), (0.38, 0.31, 0.25, 1.0)),
            obj("medicine_b1", "cylinder", (0.032, 0.065), (-0.16, 0.08, 0.81), (0.28, 0.34, 0.35, 1.0)),
            obj("medicine_b3", "cylinder", (0.032, 0.065), (-0.04, 0.08, 0.81), (0.42, 0.24, 0.20, 1.0)),
            obj("rx01_tray", "box", (0.16, 0.11, 0.02), (0.18, -0.05, 0.73), (0.25, 0.29, 0.30, 1.0)),
            obj("rx02_tray", "box", (0.16, 0.11, 0.02), (0.18, 0.22, 0.73), (0.25, 0.29, 0.30, 1.0)),
            obj("barcode_scanner", "box", (0.05, 0.035, 0.08), (0.40, 0.24, 0.79), (0.22, 0.29, 0.31, 1.0)),
            obj("sealed_carton", "box", (0.11, 0.08, 0.065), (0.42, -0.18, 0.78), (0.41, 0.35, 0.27, 1.0)),
        ),
        fault_code="wrong_drug_b3",
        fault_stage="detect_b3",
        recovery_stage="repick_b1",
        success_predicate="orders_correct",
        final_predicates=("wrong_drug_isolated", "packaging_gate_passed"),
        metric_values={"sealed_packages": 2.0, "inventory_conserved": 1.0},
    )
