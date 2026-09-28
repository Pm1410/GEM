"""Registry pattern for pure rule check evaluation functions."""

from typing import Callable, Any
from gem_api.rules.models import CheckResult, VerificationContext

CheckHandler = Callable[[VerificationContext, dict[str, Any]], CheckResult]

CHECK_REGISTRY: dict[str, CheckHandler] = {}


def register_check(name: str):
    """Decorator to register a pure evaluation function for a given check type name."""
    def decorator(fn: CheckHandler) -> CheckHandler:
        CHECK_REGISTRY[name] = fn
        return fn
    return decorator


def get_check_handler(name: str) -> CheckHandler:
    """Retrieves the handler for a check type, raising KeyError if not found."""
    if name not in CHECK_REGISTRY:
        raise KeyError(
            f"Unknown check type '{name}'. Registered check types: {sorted(list(CHECK_REGISTRY.keys()))}"
        )
    return CHECK_REGISTRY[name]


def list_registered_checks() -> list[str]:
    """Lists all currently registered check type names."""
    return sorted(list(CHECK_REGISTRY.keys()))
