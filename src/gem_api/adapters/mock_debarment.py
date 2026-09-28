"""Simulated Debarment Portal Adapter (PORT-06)."""

import json
from pathlib import Path
from typing import Any, Optional
from datetime import datetime, timezone, timedelta

from gem_api.adapters.base import (
    PortalAdapter,
    PortalResult,
    PortalStatus,
    FailureMode,
    AdapterSource,
)

DATA_PATH = Path(__file__).parent / "data" / "synthetic_portals.json"


class MockDebarmentAdapter(PortalAdapter):
    """Simulates Debarment / Blacklisting portal lookup with scope and active dates."""

    def __init__(
        self,
        latency_ms: int = 0,
        fail_mode: Optional[FailureMode] = None,
        source: AdapterSource = "SIMULATED",
        data_override: Optional[dict[str, Any]] = None,
    ):
        super().__init__(latency_ms=latency_ms, fail_mode=fail_mode, source=source)
        if data_override is not None:
            self._records = data_override
        else:
            with open(DATA_PATH, "r", encoding="utf-8") as f:
                self._records = json.load(f).get("debarment", {})

    async def lookup(self, id_value: str) -> PortalResult:
        """Looks up debarment status by entity PAN or identifier."""
        try:
            await self._simulate_network()
        except TimeoutError as te:
            return PortalResult(
                status="TIMEOUT",
                source=self.source,
                latency_ms=self.latency_ms,
                error_message=str(te),
            )
        except ConnectionError as ce:
            return PortalResult(
                status="ERROR",
                source=self.source,
                latency_ms=self.latency_ms,
                error_message=str(ce),
            )

        clean_id = id_value.strip().upper()
        record = self._records.get(clean_id)

        fetched_at = datetime.now(timezone.utc)
        is_cached = False
        if self.fail_mode == "stale":
            is_cached = True
            fetched_at = fetched_at - timedelta(days=120)

        # If not explicitly listed, entity is presumed CLEARED (not debarred)
        if not record:
            return PortalResult(
                status="ACTIVE",
                fields={
                    "is_debarred": False,
                    "debarment_status": "CLEARED",
                    "entity_id": clean_id,
                    "records": [],
                },
                raw_payload={"status": "CLEARED", "records": []},
                fetched_at=fetched_at,
                latency_ms=self.latency_ms,
                source=self.source,
                is_cached=is_cached,
            )

        is_debarred = record.get("is_debarred", False)
        status_val: PortalStatus = "SUSPENDED" if is_debarred else "ACTIVE"

        return PortalResult(
            status=status_val,
            fields={
                "is_debarred": is_debarred,
                "debarment_status": "DEBARRED" if is_debarred else "CLEARED",
                "entity_id": clean_id,
                "records": record.get("records", []),
            },
            raw_payload=record,
            fetched_at=fetched_at,
            latency_ms=self.latency_ms,
            source=self.source,
            is_cached=is_cached,
        )
