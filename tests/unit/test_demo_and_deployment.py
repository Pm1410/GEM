"""Unit tests for deployment infrastructure and institutional limitations disclosures (DEMO-02)."""

from pathlib import Path
import pytest
import yaml
from fastapi.testclient import TestClient

from gem_api.main import app

client = TestClient(app)


def test_dockerfile_specification():
    """Verify production Dockerfile adheres to security and dependency specifications."""
    dockerfile_path = Path("Dockerfile")
    assert dockerfile_path.exists(), "Dockerfile must exist at repository root."

    content = dockerfile_path.read_text()
    assert "FROM python:3.12-slim" in content
    assert "tesseract-ocr" in content
    assert "libgl1" in content
    assert "EXPOSE 8000" in content
    assert "HEALTHCHECK" in content
    assert "gem_api.main:app" in content


def test_docker_compose_configuration():
    """Verify multi-container docker-compose.yml orchestrates API and DB with healthchecks."""
    compose_path = Path("docker-compose.yml")
    assert compose_path.exists(), "docker-compose.yml must exist at repository root."

    with open(compose_path, "r") as f:
        compose_cfg = yaml.safe_load(f)

    assert "services" in compose_cfg
    services = compose_cfg["services"]
    assert "db" in services, "Must declare PostgreSQL database service."
    assert "api" in services, "Must declare FastAPI application service."

    # Verify database healthcheck
    db_service = services["db"]
    assert "postgres" in db_service["image"]
    assert "healthcheck" in db_service

    # Verify dependency on healthy database
    api_service = services["api"]
    assert "depends_on" in api_service
    assert api_service["depends_on"]["db"]["condition"] == "service_healthy"


def test_render_hosted_deployment_descriptor():
    """Verify hosted demo descriptor (render.yaml) is present with on-premises architecture notes."""
    render_path = Path("render.yaml")
    assert render_path.exists(), "render.yaml must exist at repository root."

    content = render_path.read_text()
    assert "on-premises" in content.lower()
    assert "gem-bid-verification-api" in content
    assert "gem-bid-verification-db" in content


def test_limitations_document_disclosures():
    """Verify LIMITATIONS.md documents statutory boundaries, simulated adapters, and legal disclaimers."""
    limitations_path = Path("LIMITATIONS.md")
    assert limitations_path.exists(), "LIMITATIONS.md must exist at repository root."

    content = limitations_path.read_text()
    assert "ADVISORY — NOT A FINAL DISQUALIFICATION" in content
    assert "SIMULATED" in content
    assert "Zero-LLM" in content or "Zero LLM" in content
    assert "DPDP Act 2023" in content
    assert "On-Premises" in content or "on-premises" in content
    assert "Mod-36" in content


def test_api_limitations_endpoint():
    """Verify GET /api/limitations returns structured institutional transparency disclosures."""
    response = client.get("/api/limitations")
    assert response.status_code == 200

    data = response.json()
    assert "Deterministic" in data["system_classification"]
    assert "Sovereign On-Premises" in data["deployment_paradigm"]
    assert "ADVISORY — NOT A FINAL DISQUALIFICATION" in data["legal_disclaimer"]
    assert data["simulated_adapters"]["source_tag"] == "SIMULATED"
    assert len(data["simulated_adapters"]["adapters"]) >= 5
    assert "Zero LLM" in data["ai_boundary"]["decision_path"]
    assert "AES-256-GCM" in data["sovereign_security"]["encryption_at_rest"]
