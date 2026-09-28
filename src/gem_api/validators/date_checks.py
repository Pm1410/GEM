"""Certificate and license date validity comparison against bid opening date."""

from datetime import date, datetime
from typing import Optional, Union


def _parse_date(d: Union[date, datetime, str]) -> date:
    if isinstance(d, datetime):
        return d.date()
    if isinstance(d, date):
        return d
    if isinstance(d, str):
        # Support standard ISO YYYY-MM-DD
        return datetime.strptime(d.strip(), "%Y-%m-%d").date()
    raise ValueError(f"Cannot parse value as date: {d}")


def validate_certificate_validity(
    cert_expiry: Optional[Union[date, str]],
    bid_opening_date: Union[date, str]
) -> "ValidatorResult":
    """Compares certificate expiration date against the tender's bid opening date.

    CRITICAL RULE (VALD-05): Comparison is STRICTLY against the tender's
    bid opening date, NEVER the current system date.
    """
    from gem_api.validators import ValidatorResult

    if cert_expiry is None:
        return ValidatorResult(
            is_valid=False,
            code="CERT_DATE_MISSING",
            reason="Certificate expiration date is missing or not provided."
        )

    try:
        parsed_expiry = _parse_date(cert_expiry)
    except Exception as e:
        return ValidatorResult(
            is_valid=False,
            code="CERT_DATE_PARSE_ERROR",
            reason=f"Failed to parse certificate expiration date '{cert_expiry}': {e}",
            details={"input": str(cert_expiry)}
        )

    try:
        parsed_bid_opening = _parse_date(bid_opening_date)
    except Exception as e:
        return ValidatorResult(
            is_valid=False,
            code="BID_OPENING_DATE_PARSE_ERROR",
            reason=f"Failed to parse bid opening date '{bid_opening_date}': {e}",
            details={"input": str(bid_opening_date)}
        )

    if parsed_expiry < parsed_bid_opening:
        return ValidatorResult(
            is_valid=False,
            code="CERT_EXPIRED_BEFORE_BID_OPENING",
            reason=(
                f"Certificate expired on {parsed_expiry.isoformat()}, which is before "
                f"the tender bid opening date {parsed_bid_opening.isoformat()}."
            ),
            details={
                "cert_expiry": parsed_expiry.isoformat(),
                "bid_opening_date": parsed_bid_opening.isoformat(),
                "days_expired": (parsed_bid_opening - parsed_expiry).days
            }
        )

    return ValidatorResult(
        is_valid=True,
        code="CERT_VALID_AT_BID_OPENING",
        reason=f"Certificate valid as of bid opening date {parsed_bid_opening.isoformat()} (expires {parsed_expiry.isoformat()}).",
        details={
            "cert_expiry": parsed_expiry.isoformat(),
            "bid_opening_date": parsed_bid_opening.isoformat(),
            "validity_remaining_days": (parsed_expiry - parsed_bid_opening).days
        }
    )
