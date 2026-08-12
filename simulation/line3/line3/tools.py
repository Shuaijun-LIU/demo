from __future__ import annotations


class ToolDock:
    """Tracks exclusive tool ownership and explicit dock returns."""

    def __init__(self, tool_ids: tuple[str, ...]) -> None:
        if not tool_ids or len(set(tool_ids)) != len(tool_ids):
            raise ValueError("tool IDs must be unique")
        self._owners = {tool_id: None for tool_id in tool_ids}
        self._arm_tools: dict[str, str] = {}

    def attach(self, arm_id: str, tool_id: str) -> None:
        if tool_id not in self._owners:
            raise ValueError(f"unknown tool: {tool_id}")
        if self._owners[tool_id] is not None:
            raise RuntimeError(f"tool {tool_id} is already attached")
        if arm_id in self._arm_tools:
            raise RuntimeError(f"{arm_id} already carries {self._arm_tools[arm_id]}")
        self._owners[tool_id] = arm_id
        self._arm_tools[arm_id] = tool_id

    def detach(self, arm_id: str, tool_id: str) -> None:
        if self._owners.get(tool_id) != arm_id:
            raise RuntimeError(f"{arm_id} does not carry {tool_id}")
        self._owners[tool_id] = None
        del self._arm_tools[arm_id]

    def tool_owner(self, tool_id: str) -> str | None:
        if tool_id not in self._owners:
            raise ValueError(f"unknown tool: {tool_id}")
        return self._owners[tool_id]

    def arm_tool(self, arm_id: str) -> str | None:
        return self._arm_tools.get(arm_id)
