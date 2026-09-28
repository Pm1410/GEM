"""Simulated Udyam Portal Adapter (PORT-03)."""

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


class MockUdyamAdapter(PortalAdapter):
    """Simulates Udyam MSME portal lookup for enterprise category & status."""

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
                self._records = json.load(f).get("udyam", {})

    async def lookup(self, id_value: str) -> PortalResult:
        """Looks up Udyam MSME registration status and enterprise category."""
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

        clean_udyam = id_value.strip().upper()
        record = self._records.get(clean_udyam)

        if not record:
            return PortalResult(
                status="NOT_FOUND",
                fields={"found": False, "udyam_registration_number": clean_udyam},
                raw_payload={},
                source=self.source,
                latency_ms=self.latency_ms,
            )

        fetched_at = datetime.now(timezone.utc)
        is_cached = False
        if self.fail_mode == "stale":
            is_cached = True
            fetched_at = fetched_at - timedelta(days=120)

        status_val: PortalStatus = "ACTIVE" if record.get("status") == "ACTIVE" else "INACTIVE"

        return PortalResult(
            status=status_val,
            fields={
                "udyam_registration_number": clean_udyam,
                "enterprise_name": record.get("enterprise_name"),
                "enterprise_category": record.get("enterprise_category"),
                "major_activity": record.get("major_activity"),
                "incorporation_date": record.get("incorporation_date"),
                "registration_date": record.get("registration_date"),
                "pan": record.get("pan"),
            },
            raw_payload=record,
            fetched_at=fetched_at,
            latency_ms=self.latency_ms,
            source=self.source,
            is_cached=is_cached,
        )
