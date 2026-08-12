from __future__ import annotations

import numpy as np
from numpy.typing import ArrayLike, NDArray


class JointPositionController:
    def __init__(self, *, max_delta: float) -> None:
        if max_delta <= 0:
            raise ValueError("max_delta must be positive")
        self.max_delta = float(max_delta)

    def compute(
        self,
        current: ArrayLike,
        target: ArrayLike,
        *,
        lower: ArrayLike,
        upper: ArrayLike,
    ) -> NDArray[np.float64]:
        current_array = np.asarray(current, dtype=np.float64)
        target_array = np.asarray(target, dtype=np.float64)
        lower_array = np.asarray(lower, dtype=np.float64)
        upper_array = np.asarray(upper, dtype=np.float64)
        if not (current_array.shape == target_array.shape == lower_array.shape == upper_array.shape):
            raise ValueError("joint controller inputs must have identical shapes")
        desired = np.clip(target_array, lower_array, upper_array)
        return np.clip(desired - current_array, -self.max_delta, self.max_delta)


class CartesianDlsController:
    def __init__(self, *, damping: float, max_joint_delta: float) -> None:
        if damping <= 0 or max_joint_delta <= 0:
            raise ValueError("damping and max_joint_delta must be positive")
        self.damping = float(damping)
        self.max_joint_delta = float(max_joint_delta)

    def compute(self, jacobian: ArrayLike, task_delta: ArrayLike) -> NDArray[np.float64]:
        jacobian_array = np.asarray(jacobian, dtype=np.float64)
        delta_array = np.asarray(task_delta, dtype=np.float64)
        if jacobian_array.ndim != 2 or delta_array.shape != (jacobian_array.shape[0],):
            raise ValueError("task delta dimension must match Jacobian rows")
        regularizer = self.damping * self.damping * np.eye(jacobian_array.shape[0])
        joint_delta = jacobian_array.T @ np.linalg.solve(jacobian_array @ jacobian_array.T + regularizer, delta_array)
        return np.clip(joint_delta, -self.max_joint_delta, self.max_joint_delta)
