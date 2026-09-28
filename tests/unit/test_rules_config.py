"""Unit tests for YAML rule config parsing and strict schema validation."""

from pathlib import Path
import pytest
from pydantic import ValidationError

from gem_api.rules import load_tender_rules, TenderRuleConfig


def test_load_sample_goods_yaml():
    path = Path("config/tenders/sample_goods.yaml")
    config = load_tender_rules(path)

    assert isinstance(config, TenderRuleConfig)
    assert config.tender_id == "TND-2026-GOODS-001"
    assert config.tender_category == "goods"
    assert config.local_content_threshold == 50.0
    assert len(config.requirements) == 4
    assert config.requirements[0].id == "REQ-01"


def test_load_sample_services_yaml():
    path = Path("config/tenders/sample_services.yaml")
    config = load_tender_rules(path)

    assert isinstance(config, TenderRuleConfig)
    assert config.tender_id == "TND-2026-SRV-002"
    assert config.tender_category == "services"
    epfo_req = next(r for r in config.requirements if r.id == "REQ-03")
    assert epfo_req.applies_if == {"tender_category": "services"}


def test_missing_file_raises_error():
    with pytest.raises(FileNotFoundError):
        load_tender_rules("non_existent_tender.yaml")


def test_malformed_yaml_syntax_raises_error():
    bad_yaml = "tender_id: [unclosed list"
    with pytest.raises(ValueError, match="Malformed YAML"):
        load_tender_rules(bad_yaml)


def test_missing_required_fields_fails_fast():
    # Missing required 'tender_category', 'version', etc.
    incomplete_yaml = """
tender_id: "TND-INVALID"
requirements: []
"""
    with pytest.raises(ValueError, match="Strict validation failed"):
        load_tender_rules(incomplete_yaml)
