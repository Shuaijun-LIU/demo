from __future__ import annotations

from dataclasses import dataclass
from typing import Mapping


class ZoneLock:
    """Exclusive zone locks with a global acquisition order."""

    def __init__(self, order: tuple[str, ...]) -> None:
        if not order or len(set(order)) != len(order):
            raise ValueError("lock order must contain unique zones")
        self._order = {zone: index for index, zone in enumerate(order)}
        self._owners: dict[str, str] = {}

    @property
    def owners(self) -> dict[str, str]:
        return dict(self._owners)

    def acquire(self, arm_id: str, zone: str) -> None:
        if zone not in self._order:
            raise ValueError(f"unknown zone: {zone}")
        held = [self._order[name] for name, holder in self._owners.items() if holder != arm_id]
        if held and self._order[zone] < max(held):
            raise RuntimeError(f"global order violation while acquiring {zone}")
        owner = self._owners.get(zone)
        if owner is not None and owner != arm_id:
            raise RuntimeError(f"zone {zone} is owned by {owner}")
        self._owners[zone] = arm_id

    def release(self, arm_id: str, zone: str) -> None:
        if self._owners.get(zone) != arm_id:
            raise RuntimeError(f"zone {zone} is not owned by {arm_id}")
        del self._owners[zone]


class Barrier:
    def __init__(self, name: str, participants: tuple[str, ...]) -> None:
        if not participants or len(set(participants)) != len(participants):
            raise ValueError("barrier participants must be unique")
        self.name = name
        self._participants = frozenset(participants)
        self._arrived: set[str] = set()

    @property
    def complete(self) -> bool:
        return self._arrived == self._participants

    def arrive(self, arm_id: str) -> bool:
        if arm_id not in self._participants:
            raise ValueError(f"{arm_id} is not a barrier participant")
        self._arrived.add(arm_id)
        return self.complete


@dataclass(frozen=True)
class HandoffEvent:
    object_id: str
    from_holder: str
    to_holder: str


class Handoff:
    def __init__(self, *, object_id: str, sender: str, receiver: str) -> None:
        if sender == receiver:
            raise ValueError("sender and receiver must differ")
        self.object_id = object_id
        self.sender = sender
        self.receiver = receiver
        self._begun = False
        self._confirmed = False

    def begin(self, *, holder: str) -> None:
        if holder != self.sender:
            raise RuntimeError(f"handoff must begin with {self.sender} holding {self.object_id}")
        self._begun = True

    def confirm_receiver(self, *, closed: bool, contact: bool) -> None:
        if not self._begun:
            raise RuntimeError("handoff has not begun")
        self._confirmed = closed is True and contact is True

    def release_sender(self) -> HandoffEvent:
        if not self._confirmed:
            raise RuntimeError("receiver confirmation is required before sender release")
        self._begun = False
        self._confirmed = False
        return HandoffEvent(self.object_id, self.sender, self.receiver)


class HoldWhile:
    def __init__(self, predicates: tuple[str, ...]) -> None:
        if not predicates:
            raise ValueError("at least one hold predicate is required")
        self._predicates = predicates

    def check(self, values: Mapping[str, bool]) -> None:
        for predicate in self._predicates:
            if values.get(predicate) is not True:
                raise RuntimeError(f"hold predicate failed: {predicate}")
