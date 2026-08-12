from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Mapping

import numpy as np
from numpy.typing import NDArray


@dataclass(frozen=True)
class LoadedEpisode:
    metadata: Mapping[str, Any]
    observations: Mapping[str, NDArray[np.generic]]
    actions: NDArray[np.float32]
    events: tuple[Mapping[str, Any], ...]
    oracle_predicates: tuple[Mapping[str, bool], ...]
    file_sha256: str


class EpisodeRecorder:
    def __init__(self, *, task_id: str, seed: int, asset_manifest_hash: str) -> None:
        if len(asset_manifest_hash) != 64:
            raise ValueError("asset_manifest_hash must be a sha256 digest")
        self._metadata: dict[str, Any] = {
            "schema_version": 1,
            "task_id": task_id,
            "seed": int(seed),
            "asset_manifest_hash": asset_manifest_hash,
        }
        self._observations: dict[str, list[NDArray[np.generic]]] = {}
        self._actions: list[NDArray[np.float32]] = []
        self._events: list[Mapping[str, Any]] = []
        self._oracle_predicates: list[Mapping[str, bool]] = []
        self.file_sha256: str | None = None

    def append(
        self,
        observation: Mapping[str, NDArray[np.generic]],
        action: NDArray[np.float32],
        *,
        event: Mapping[str, Any],
        oracle_predicates: Mapping[str, bool],
    ) -> None:
        if self._observations and set(observation) != set(self._observations):
            raise ValueError("observation keys changed within an episode")
        for key, value in observation.items():
            self._observations.setdefault(key, []).append(np.asarray(value).copy())
        self._actions.append(np.asarray(action, dtype=np.float32).copy())
        self._events.append(dict(event))
        self._oracle_predicates.append(dict(oracle_predicates))

    def finish(self, *, info: Mapping[str, Any]) -> None:
        self._metadata["steps"] = len(self._actions)
        self._metadata["final_info"] = dict(info)

    def save(self, path: Path) -> Path:
        if not self._actions:
            raise RuntimeError("cannot save an empty episode")
        target = Path(path)
        target.parent.mkdir(parents=True, exist_ok=True)
        payload: dict[str, Any] = {
            "actions": np.stack(self._actions),
            "metadata_json": np.asarray(json.dumps(self._metadata, sort_keys=True, separators=(",", ":"))),
            "events_json": np.asarray(json.dumps(self._events, sort_keys=True, separators=(",", ":"))),
            "oracle_json": np.asarray(json.dumps(self._oracle_predicates, sort_keys=True, separators=(",", ":"))),
        }
        payload.update({f"obs__{key}": np.stack(values) for key, values in self._observations.items()})
        np.savez_compressed(target, **payload)
        self.file_sha256 = hashlib.sha256(target.read_bytes()).hexdigest()
        return target


def load_episode(path: Path) -> LoadedEpisode:
    target = Path(path)
    digest = hashlib.sha256(target.read_bytes()).hexdigest()
    with np.load(target, allow_pickle=False) as data:
        metadata = json.loads(str(data["metadata_json"]))
        events = tuple(json.loads(str(data["events_json"])))
        oracle_predicates = tuple(json.loads(str(data["oracle_json"])))
        observations = {key.removeprefix("obs__"): data[key].copy() for key in data.files if key.startswith("obs__")}
        actions = np.asarray(data["actions"], dtype=np.float32).copy()
    return LoadedEpisode(metadata, observations, actions, events, oracle_predicates, digest)
