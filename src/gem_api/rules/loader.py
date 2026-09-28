"""YAML rule configuration loader with strict Pydantic validation."""

from pathlib import Path
from typing import Union
import yaml
from pydantic import ValidationError

from gem_api.rules.models import TenderRuleConfig


def load_tender_rules(source: Union[str, Path]) -> TenderRuleConfig:
    """Loads and strictly validates a tender rule configuration YAML.

    Fails fast on syntax errors, missing fields, or invalid types.
    """
    if isinstance(source, Path) or (isinstance(source, str) and (source.endswith(".yaml") or source.endswith(".yml")) and "\n" not in source):
        path = Path(source)
        if not path.exists():
            raise FileNotFoundError(f"Tender configuration file not found: {path}")
        content = path.read_text(encoding="utf-8")
    else:
        content = str(source)

    try:
        raw_data = yaml.safe_load(content)
    except yaml.YAMLError as e:
        raise ValueError(f"Malformed YAML in tender rule configuration: {e}") from e

    if not isinstance(raw_data, dict):
        raise ValueError(f"Tender rule configuration must be a mapping, got {type(raw_data).__name__}")

    try:
        return TenderRuleConfig.model_validate(raw_data)
    except ValidationError as e:
        raise ValueError(f"Strict validation failed for tender rule configuration: {e}") from e
