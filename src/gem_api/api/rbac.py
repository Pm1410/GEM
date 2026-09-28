"""Role-based access control (RBAC) dependencies (OFCR-05)."""

from dataclasses import dataclass
from typing import Literal, Optional
from fastapi import Header, HTTPException, status

UserRole = Literal["officer", "evaluator", "admin", "auditor"]
VALID_ROLES: set[str] = {"officer", "evaluator", "admin", "auditor"}


@dataclass
class UserContext:
    user_id: str
    role: UserRole


def get_current_user(
    x_user_role: Optional[str] = Header("officer", alias="X-User-Role"),
    x_user_id: Optional[str] = Header("officer-01", alias="X-User-Id"),
) -> UserContext:
    """Extracts user identity and role from headers with fallback for prototype."""
    role_str = (x_user_role or "officer").lower().strip()
    if role_str not in VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid user role '{role_str}'. Allowed: {VALID_ROLES}",
        )
    return UserContext(user_id=x_user_id or "user-01", role=role_str)  # type: ignore


def require_roles(allowed_roles: list[UserRole]):
    """FastAPI dependency factory enforcing allowed roles."""
    def role_checker(user: UserContext = None) -> UserContext:
        if user is None:
            user = get_current_user()
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{user.role}' is not authorized. Required: {allowed_roles}",
            )
        return user
    return role_checker
