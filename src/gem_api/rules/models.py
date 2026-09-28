"""Rule engine data models and configuration schemas."""

from datetime import date
from typing import Any, Literal, Optional
from pydantic import BaseModel, Field

ResultState = Literal["PASS", "FAIL", "REVIEW", "UNVERIFIABLE"]


class ActionOverrides(BaseModel):
    """Optional overrides for default outcome state transitions."""
    on_fail: Optional[ResultState] = None
    on_missing: Optional[ResultState] = None
    on_portal_down: Optional[ResultState] = None


class CheckConfig(BaseModel):
    """Configuration for an individual check step within a requirement."""
    id: str
    type: str
    params: dict[str, Any] = Field(default_factory=dict)
    overrides: Optional[ActionOverrides] = None


class RequirementConfig(BaseModel):
    """Configuration for a tender requirement (e.g. GSTIN registration, MSME preference)."""
    id: str
    description: str
    mandatory: bool = True
    applies_if: Optional[dict[str, Any]] = None
    evidence_types: list[str] = Field(default_factory=list)
    checks: list[CheckConfig] = Field(default_factory=list)


class TenderRuleConfig(BaseModel):
    """Versioned tender-specific rule configuration (RULE-01)."""
    tender_id: str
    version: str
    rule_set_version: str
    title: str
    tender_category: str  # e.g., 'goods', 'services', 'works'
    bid_opening_date: Optional[date] = None
    estimated_value: Optional[float] = None
    local_content_threshold: Optional[float] = None
    requirements: list[RequirementConfig] = Field(default_factory=list)


class VerificationContext(BaseModel):
    """Runtime context passed into the rule evaluation engine."""
    tender: dict[str, Any] = Field(default_factory=dict)
    bidder: dict[str, Any] = Field(default_factory=dict)
    evidence: dict[str, Any] = Field(default_factory=dict)
    portal_results: dict[str, Any] = Field(default_factory=dict)


class CheckResult(BaseModel):
    """Evaluation result for an individual check."""
    check_id: str
    state: ResultState
    message: str
    details: dict[str, Any] = Field(default_factory=dict)


class RequirementEvaluation(BaseModel):
    """Combined evaluation result for a requirement."""
    requirement_id: str
    state: ResultState
    is_applicable: bool = True
    check_results: list[CheckResult] = Field(default_factory=list)


class TenderEvaluationReport(BaseModel):
    """Complete evaluation report for a bidder against a tender."""
    tender_id: str
    tender_version: str
    rule_set_version: str
    bidder_id: str
    overall_state: ResultState
    requirements: list[RequirementEvaluation] = Field(default_factory=list)
