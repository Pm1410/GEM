"""Base PortalAdapter and PortalResult contract."""

from abc import ABC, abstractmethod
import asyncio
from datetime import datetime, timezone
from typing import Any, Literal, Optional
from pydantic import BaseModel, Field

PortalStatus = Literal["ACTIVE", "INACTIVE", "SUSPENDED", "ERROR", "TIMEOUT", "NOT_FOUND"]
AdapterSource = Literal["SIMULATED", "LIVE"]
FailureMode = Literal["timeout", "error", "stale"]


class PortalResult(BaseModel):
    """Normalized response contract for all portal integrations (PORT-01).

    Every portal adapter returns this structure.
    """
    status: PortalStatus
    fields: dict[str, Any] = Field(default_factory=dict)
    raw_payload: dict[str, Any] = Field(default_factory=dict)
    fetched_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    latency_ms: int = 0
    source: AdapterSource = "SIMULATED"
    is_cached: bool = False
    error_message: Optional[str] = None


class PortalAdapter(ABC):
    """Abstract base class for portal adapters with injectable latency and failures."""

    def __init__(
        self,
        latency_ms: int = 0,
        fail_mode: Optional[FailureMode] = None,
        source: AdapterSource = "SIMULATED"
    ):
        self.latency_ms = latency_ms
        self.fail_mode = fail_mode
        self.source = source

    async def _simulate_network(self) -> None:
        """Injects simulated network latency and failure modes."""
        if self.latency_ms > 0:
            await asyncio.sleep(self.latency_ms / 1000.0)

        if self.fail_mode == "timeout":
            raise TimeoutError("Portal connection timed out after simulated latency.")
        elif self.fail_mode == "error":
            raise ConnectionError("Simulated portal internal server error (HTTP 500).")

    @abstractmethod
    async def lookup(self, id_value: str) -> PortalResult:
        """Performs lookup for the specified entity identifier."""
        pass
