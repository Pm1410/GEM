"""Built-in deterministic check handlers for the rule engine."""

from datetime import date, datetime
from typing import Any
from gem_api.rules.models import CheckResult, VerificationContext
from gem_api.rules.registry import register_check
from gem_api.validators import (
    validate_gstin,
    validate_pan,
    validate_udyam,
    validate_certificate_validity,
    validate_gstin_pan_match,
)


@register_check("format_gstin")
def check_format_gstin(context: VerificationContext, params: dict[str, Any]) -> CheckResult:
    gstin = context.evidence.get("gstin") or context.bidder.get("gstin")
    if not gstin:
        return CheckResult(
            check_id=params.get("id", "CHK-GSTIN"),
            state="REVIEW",
            message="GSTIN value missing from submitted evidence and bidder profile."
        )

    res = validate_gstin(gstin)
    if res.is_valid:
        return CheckResult(
            check_id=params.get("id", "CHK-GSTIN"),
            state="PASS",
            message=res.reason or "GSTIN is valid and passes Mod-36 checksum.",
            details=res.details
        )
    return CheckResult(
        check_id=params.get("id", "CHK-GSTIN"),
        state="FAIL",
        message=res.reason or "GSTIN format or checksum validation failed.",
        details=res.details
    )


@register_check("format_pan")
def check_format_pan(context: VerificationContext, params: dict[str, Any]) -> CheckResult:
    pan = context.evidence.get("pan") or context.bidder.get("pan")
    if not pan:
        return CheckResult(
            check_id=params.get("id", "CHK-PAN"),
            state="REVIEW",
            message="PAN value missing from submitted evidence and bidder profile."
        )

    res = validate_pan(pan)
    if res.is_valid:
        return CheckResult(
            check_id=params.get("id", "CHK-PAN"),
            state="PASS",
            message=res.reason or "PAN format is valid.",
            details=res.details
        )
    return CheckResult(
        check_id=params.get("id", "CHK-PAN"),
        state="FAIL",
        message=res.reason or "PAN format validation failed.",
        details=res.details
    )


@register_check("format_udyam")
def check_format_udyam(context: VerificationContext, params: dict[str, Any]) -> CheckResult:
    udyam = context.evidence.get("udyam") or context.bidder.get("udyam_number")
    if not udyam:
        return CheckResult(
            check_id=params.get("id", "CHK-UDYAM"),
            state="REVIEW",
            message="Udyam registration number missing."
        )

    res = validate_udyam(udyam)
    if res.is_valid:
        return CheckResult(
            check_id=params.get("id", "CHK-UDYAM"),
            state="PASS",
            message=res.reason or "Udyam format is valid.",
            details=res.details
        )
    return CheckResult(
        check_id=params.get("id", "CHK-UDYAM"),
        state="FAIL",
        message=res.reason or "Udyam format validation failed.",
        details=res.details
    )


@register_check("cross_check_gstin_pan")
def check_cross_gstin_pan(context: VerificationContext, params: dict[str, Any]) -> CheckResult:
    gstin = context.evidence.get("gstin") or context.bidder.get("gstin")
    pan = context.evidence.get("pan") or context.bidder.get("pan")

    if not gstin or not pan:
        return CheckResult(
            check_id=params.get("id", "CHK-X-GSTIN-PAN"),
            state="REVIEW",
            message="Cannot perform cross-check: either GSTIN or PAN is missing."
        )

    res = validate_gstin_pan_match(gstin, pan)
    if res.is_valid:
        return CheckResult(
            check_id=params.get("id", "CHK-X-GSTIN-PAN"),
            state="PASS",
            message=res.reason or "GSTIN and PAN cross-match verified.",
            details=res.details
        )
    return CheckResult(
        check_id=params.get("id", "CHK-X-GSTIN-PAN"),
        state="FAIL",
        message=res.reason or "GSTIN embedded PAN does not match supplied PAN.",
        details=res.details
    )


@register_check("certificate_validity")
def check_certificate_validity(context: VerificationContext, params: dict[str, Any]) -> CheckResult:
    cert_expiry = context.evidence.get("cert_expiry")
    bid_opening_date = context.tender.get("bid_opening_date")

    if not cert_expiry or not bid_opening_date:
        return CheckResult(
            check_id=params.get("id", "CHK-CERT-DATE"),
            state="REVIEW",
            message="Cannot verify certificate validity: expiry date or tender bid opening date is missing."
        )

    res = validate_certificate_validity(cert_expiry, bid_opening_date)
    if res.is_valid:
        return CheckResult(
            check_id=params.get("id", "CHK-CERT-DATE"),
            state="PASS",
            message=res.reason or "Certificate valid as of bid opening date.",
            details=res.details
        )
    return CheckResult(
        check_id=params.get("id", "CHK-CERT-DATE"),
        state="FAIL",
        message=res.reason or "Certificate expired before bid opening date.",
        details=res.details
    )


@register_check("make_in_india_threshold")
def check_make_in_india(context: VerificationContext, params: dict[str, Any]) -> CheckResult:
    """Make in India local content verification (RULE-04)."""
    local_content = context.evidence.get("local_content_percentage")
    if local_content is None:
        local_content = context.bidder.get("local_content_percentage")

    if local_content is None:
        return CheckResult(
            check_id=params.get("id", "CHK-MII"),
            state="REVIEW",
            message="Make in India local content percentage declaration is missing."
        )

    required_threshold = params.get("min_percentage")
    if required_threshold is None:
        required_threshold = context.tender.get("local_content_threshold", 50.0)

    try:
        val = float(local_content)
        req = float(required_threshold)
    except (ValueError, TypeError) as e:
        return CheckResult(
            check_id=params.get("id", "CHK-MII"),
            state="REVIEW",
            message=f"Invalid local content percentage value: {e}"
        )

    if val >= req:
        return CheckResult(
            check_id=params.get("id", "CHK-MII"),
            state="PASS",
            message=f"Local content of {val:.1f}% satisfies tender threshold of {req:.1f}%.",
            details={"declared_percentage": val, "threshold_percentage": req}
        )

    return CheckResult(
        check_id=params.get("id", "CHK-MII"),
        state="FAIL",
        message=f"Local content of {val:.1f}% is below required tender threshold of {req:.1f}%.",
        details={"declared_percentage": val, "threshold_percentage": req, "deficiency": req - val}
    )


@register_check("debarment_check")
def check_debarment(context: VerificationContext, params: dict[str, Any]) -> CheckResult:
    """Debarment / blacklisting check with scope evaluation (RULE-05)."""
    debarment_records = context.evidence.get("debarment_records")
    if debarment_records is None:
        portal_res = context.portal_results.get("debarment")
        if portal_res:
            debarment_records = portal_res.get("fields", {}).get("records", [])

    if debarment_records is None:
        debarment_records = []

    bid_opening_date = context.tender.get("bid_opening_date")
    if isinstance(bid_opening_date, str):
        bid_opening_date = datetime.strptime(bid_opening_date.strip(), "%Y-%m-%d").date()
    elif isinstance(bid_opening_date, datetime):
        bid_opening_date = bid_opening_date.date()

    tender_category = context.tender.get("tender_category", "").lower()

    for record in debarment_records:
        if not record.get("is_active", True):
            continue

        scope = record.get("scope", "org_wide").lower()
        if scope != "org_wide":
            record_category = record.get("category", "").lower()
            if record_category and record_category != tender_category:
                # Category mismatch, not in scope
                continue

        # Check time bounds
        start_date_str = record.get("start_date")
        end_date_str = record.get("end_date")

        in_time_bounds = True
        if bid_opening_date and start_date_str and end_date_str:
            start_d = datetime.strptime(start_date_str, "%Y-%m-%d").date()
            end_d = datetime.strptime(end_date_str, "%Y-%m-%d").date()
            if not (start_d <= bid_opening_date <= end_d):
                in_time_bounds = False

        if in_time_bounds:
            reason = record.get("reason", "Debarred by procuring authority")
            authority = record.get("authority", "Competent Authority")
            return CheckResult(
                check_id=params.get("id", "CHK-DEBARMENT"),
                state="FAIL",
                message=f"Bidder is actively debarred: {reason} (Authority: {authority}, Scope: {scope}).",
                details=record
            )

    return CheckResult(
        check_id=params.get("id", "CHK-DEBARMENT"),
        state="PASS",
        message="No active debarment or blacklisting records found in scope.",
        details={"records_checked": len(debarment_records)}
    )


@register_check("epfo_registration_check")
def check_epfo_registration(context: VerificationContext, params: dict[str, Any]) -> CheckResult:
    epfo_code = context.evidence.get("epfo_code") or context.bidder.get("epfo_code")
    if not epfo_code:
        return CheckResult(
            check_id=params.get("id", "CHK-EPFO"),
            state="REVIEW",
            message="EPFO establishment code missing from submitted evidence."
        )
    clean_code = str(epfo_code).strip()
    if len(clean_code) < 7:
        return CheckResult(
            check_id=params.get("id", "CHK-EPFO"),
            state="FAIL",
            message=f"EPFO establishment code '{clean_code}' is invalid (too short)."
        )
    return CheckResult(
        check_id=params.get("id", "CHK-EPFO"),
        state="PASS",
        message="EPFO establishment code format is valid.",
        details={"epfo_code": clean_code}
    )


@register_check("esic_registration_check")
def check_esic_registration(context: VerificationContext, params: dict[str, Any]) -> CheckResult:
    esic_code = context.evidence.get("esic_code") or context.bidder.get("esic_code")
    if not esic_code:
        return CheckResult(
            check_id=params.get("id", "CHK-ESIC"),
            state="REVIEW",
            message="ESIC employer code missing from submitted evidence."
        )
    clean_code = str(esic_code).strip().replace("-", "")
    if len(clean_code) != 17 or not clean_code.isdigit():
        return CheckResult(
            check_id=params.get("id", "CHK-ESIC"),
            state="FAIL",
            message=f"ESIC employer code must be 17 digits, got {len(clean_code)} digits."
        )
    return CheckResult(
        check_id=params.get("id", "CHK-ESIC"),
        state="PASS",
        message="ESIC employer code format is valid.",
        details={"esic_code": clean_code}
    )
