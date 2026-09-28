"""Portal adapters package."""

from gem_api.adapters.base import (
    PortalResult,
    PortalAdapter,
    PortalStatus,
    AdapterSource,
    FailureMode,
)
from gem_api.adapters.mock_gstn import MockGSTNAdapter
from gem_api.adapters.mock_udyam import MockUdyamAdapter
from gem_api.adapters.mock_epfo import MockEPFOAdapter
from gem_api.adapters.mock_esic import MockESICAdapter
from gem_api.adapters.mock_debarment import MockDebarmentAdapter

__all__ = [
    "PortalResult",
    "PortalAdapter",
    "PortalStatus",
    "AdapterSource",
    "FailureMode",
    "MockGSTNAdapter",
    "MockUdyamAdapter",
    "MockEPFOAdapter",
    "MockESICAdapter",
    "MockDebarmentAdapter",
]
