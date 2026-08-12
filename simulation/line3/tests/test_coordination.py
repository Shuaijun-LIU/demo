from __future__ import annotations

import pytest

from line3.coordination import Barrier, Handoff, HoldWhile, ZoneLock


def test_zone_lock_enforces_global_order_and_exclusive_owner() -> None:
    locks = ZoneLock(("feed", "handoff", "tool"))
    locks.acquire("arm1", "feed")
    locks.acquire("arm1", "handoff")

    with pytest.raises(RuntimeError, match="global order"):
        locks.acquire("arm2", "feed")
    with pytest.raises(RuntimeError, match="owned"):
        locks.acquire("arm2", "handoff")

    locks.release("arm1", "handoff")
    locks.release("arm1", "feed")
    assert locks.owners == {}


def test_barrier_releases_only_after_every_declared_arm_arrives() -> None:
    barrier = Barrier("three-anchor", ("arm1", "arm2", "arm3"))
    assert not barrier.arrive("arm1")
    assert not barrier.arrive("arm2")
    assert barrier.arrive("arm3")
    assert barrier.complete

    with pytest.raises(ValueError, match="participant"):
        barrier.arrive("arm4")


def test_handoff_requires_receiver_confirmation_before_sender_release() -> None:
    handoff = Handoff(object_id="P1", sender="arm1", receiver="arm2")
    handoff.begin(holder="arm1")

    with pytest.raises(RuntimeError, match="confirmation"):
        handoff.release_sender()
    handoff.confirm_receiver(closed=True, contact=True)
    event = handoff.release_sender()

    assert event.object_id == "P1"
    assert event.from_holder == "arm1"
    assert event.to_holder == "arm2"


def test_hold_while_reports_the_specific_broken_predicate() -> None:
    guard = HoldWhile(("beam_held", "plate_aligned", "side_supported"))
    guard.check({"beam_held": True, "plate_aligned": True, "side_supported": True})

    with pytest.raises(RuntimeError, match="side_supported"):
        guard.check({"beam_held": True, "plate_aligned": True, "side_supported": False})
