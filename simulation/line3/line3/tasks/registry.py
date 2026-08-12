from __future__ import annotations

from typing import Type

import gymnasium as gym

from line3.tasks.base import MultiPandaTaskEnv
from line3.tasks.demo01 import Demo01Env
from line3.tasks.demo02 import Demo02Env
from line3.tasks.demo03 import Demo03Env
from line3.tasks.demo04 import Demo04Env
from line3.tasks.demo05 import Demo05Env
from line3.tasks.demo06 import Demo06Env


TASK_IDS = ("demo01", "demo02", "demo03", "demo04", "demo05", "demo06")
GYM_IDS = tuple(f"MultiPanda-Demo{index:02d}-v0" for index in range(1, 7))

_TASK_CLASSES: dict[str, Type[MultiPandaTaskEnv]] = {
    "demo01": Demo01Env,
    "demo02": Demo02Env,
    "demo03": Demo03Env,
    "demo04": Demo04Env,
    "demo05": Demo05Env,
    "demo06": Demo06Env,
}


def make_env(task_id: str, **kwargs) -> MultiPandaTaskEnv:
    try:
        env_class = _TASK_CLASSES[task_id]
    except KeyError as error:
        raise ValueError(f"unknown Line3 task: {task_id}") from error
    return env_class(**kwargs)


def register_gymnasium_envs() -> tuple[str, ...]:
    for index, (task_id, env_class) in enumerate(_TASK_CLASSES.items(), start=1):
        gym_id = f"MultiPanda-Demo{index:02d}-v0"
        if gym_id not in gym.registry:
            gym.register(gym_id, entry_point=env_class)
    return GYM_IDS
