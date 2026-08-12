from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Mapping

import numpy as np
from numpy.typing import NDArray


FloatArray = NDArray[np.float64]


@dataclass(frozen=True)
class OracleResult:
    success: bool
    predicates: Mapping[str, bool]
    metrics: Mapping[str, float]


@dataclass(frozen=True)
class ScenarioState:
    qpos: FloatArray
    qvel: FloatArray
    ctrl: FloatArray
    qacc_warmstart: FloatArray
    time: float
    phase: int
    step_count: int
    prng_state: Mapping[str, Any]
    object_pose: FloatArray
    custody: Mapping[str, str]
    locks: Mapping[str, str]
    tools: Mapping[str, str]
    business_fault_count: int
    timers: Mapping[str, float]
    trace: tuple[str, ...]
    task_state: Mapping[str, Any]
