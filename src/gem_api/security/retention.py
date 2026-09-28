"""Evidence retention policy enforcement (SECR-04)."""

from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
from typing import Optional


@dataclass
class RetentionPolicy:
    """Document retention policy tracking statutory storage periods."""
    retention_days: int
    created_at: datetime
    expires_at: datetime
    is_expired: bool
    purge_status: str = "RETAINED"  # "RETAINED" | "PURGED" | "LOCKED"


def compute_retention_policy(
    created_at: Optional[datetime] = None,
    retention_days: int = 1825,  # 5 years standard government procurement retention
) -> RetentionPolicy:
    """Computes retention expiration and status for stored documents (SECR-04)."""
    now = datetime.now(timezone.utc)
    base_time = created_at or now

    expires_at = base_time + timedelta(days=retention_days)
    is_expired = now >= expires_at

    return RetentionPolicy(
        retention_days=retention_days,
        created_at=base_time,
        expires_at=expires_at,
        is_expired=is_expired,
        purge_status="RETAINED",
    )


def is_retention_expired(policy: RetentionPolicy, as_of: Optional[datetime] = None) -> bool:
    """Determines whether a stored evidence item has passed its statutory retention window."""
    check_time = as_of or datetime.now(timezone.utc)
    return check_time >= policy.expires_at
