from __future__ import annotations

from dataclasses import dataclass


@dataclass
class OneShotBusinessFault:
    code: str
    trigger_stage: str
    recovery_stage: str
    injected: bool = False
    recovered: bool = False

    def complete_stage(self, stage: str) -> str | None:
        if stage == self.trigger_stage and not self.injected:
            self.injected = True
            return self.code
        if stage == self.recovery_stage and self.injected:
            self.recovered = True
        return None
