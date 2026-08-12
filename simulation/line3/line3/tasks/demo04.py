from line3.tasks.base import MultiPandaTaskEnv, TaskDefinition, obj, stage


class Demo04Env(MultiPandaTaskEnv):
    definition = TaskDefinition(
        task_id="demo04",
        title="Supported structure assembly and torque verification",
        arm_count=4,
        stages=(
            stage("place_beam", 1),
            stage("align_plate", 2),
            stage("support", 4),
            stage("barrier", 1, 2, 4),
            stage("tool_pick", 3),
            stage("fasten_f1", 1, 2, 3, 4),
            stage("fasten_f2", 1, 2, 3, 4),
            stage("recover_f2", 1, 2, 3, 4),
            stage("scan", 3, 4),
            stage("fixture_takeover", 1, 2, 4),
            stage("tool_return", 3),
            stage("return_safe", 1, 2, 3, 4),
        ),
        objects=(
            obj("beam", "box", (0.42, 0.045, 0.055), (0.0, 0.04, 0.79), (0.35, 0.34, 0.31, 1.0)),
            obj("plate", "box", (0.24, 0.025, 0.18), (0.0, 0.25, 0.88), (0.27, 0.29, 0.30, 1.0)),
            obj("assembly_fixture", "box", (0.36, 0.28, 0.03), (0.0, 0.02, 0.74), (0.25, 0.26, 0.26, 1.0)),
            obj("fastener_f1", "cylinder", (0.018, 0.06), (-0.15, 0.17, 0.79), (0.50, 0.46, 0.33, 1.0)),
            obj("fastener_f2", "cylinder", (0.018, 0.06), (0.15, 0.17, 0.79), (0.50, 0.46, 0.33, 1.0)),
            obj("electric_driver", "capsule", (0.035, 0.15), (0.42, -0.20, 0.84), (0.23, 0.27, 0.28, 1.0)),
            obj("support_pad", "box", (0.13, 0.10, 0.025), (-0.40, -0.18, 0.74), (0.38, 0.32, 0.24, 1.0)),
            obj("seam_scanner", "box", (0.055, 0.035, 0.075), (0.40, 0.25, 0.79), (0.25, 0.30, 0.32, 1.0)),
        ),
        fault_code="f2_switch_miss",
        fault_stage="fasten_f2",
        recovery_stage="recover_f2",
        success_predicate="fasteners_verified",
        final_predicates=("structure_aligned", "seam_verified", "tool_docked"),
        metric_values={"plate_angle_deg": 90.8, "datum_error_m": 0.008},
    )
