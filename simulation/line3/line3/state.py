from __future__ import annotations

import hashlib
import json
from collections.abc import Mapping, Sequence
from typing import Any

import numpy as np

from line3.types import ScenarioState


def _json_value(value: Any) -> Any:
    if isinstance(value, np.ndarray):
        return value.tolist()
    if isinstance(value, np.generic):
        return value.item()
    if isinstance(value, Mapping):
        return {str(key): _json_value(item) for key, item in sorted(value.items(), key=lambda pair: str(pair[0]))}
    if isinstance(value, Sequence) and not isinstance(value, (str, bytes, bytearray)):
        return [_json_value(item) for item in value]
    return value


def state_hash(state: ScenarioState) -> str:
    payload = {
        "qpos": state.qpos,
        "qvel": state.qvel,
        "ctrl": state.ctrl,
        "qacc_warmstart": state.qacc_warmstart,
        "time": state.time,
        "phase": state.phase,
        "step_count": state.step_count,
        "prng_state": state.prng_state,
        "object_pose": state.object_pose,
        "custody": state.custody,
        "locks": state.locks,
        "tools": state.tools,
        "business_fault_count": state.business_fault_count,
        "timers": state.timers,
        "trace": state.trace,
        "task_state": state.task_state,
    }
    encoded = json.dumps(_json_value(payload), sort_keys=True, separators=(",", ":"), allow_nan=False).encode()
    return hashlib.sha256(encoded).hexdigest()


def trace_hash(trace: tuple[str, ...]) -> str:
    return hashlib.sha256("\n".join(trace).encode()).hexdigest()
