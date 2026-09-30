"""FastAPI application entry point for the GeM Bid Verification Platform.

Architecture:
- This FastAPI backend serves as the deterministic rule engine and scoring microservice
- The React/Express frontend (frontend/) connects to this for computation-heavy operations
- In standalone mode, FastAPI can also serve a static frontend build from src/gem_api/static/

Integration ports:
- FastAPI:  http://localhost:8000  (Python backend — rule engine, validators, audit)
- Express:  http://localhost:3000  (Node frontend — React UI, rich data store, advisory)

For demo, run both:
  Terminal 1: cd frontend && npm run dev
  Terminal 2: uvicorn gem_api.main:app --reload --port 8000
"""

import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from gem_api.api.routes import router as api_router

STATIC_DIR = Path(__file__).parent / "static"

app = FastAPI(
    title="GeM Bid Eligibility Verification Platform API",
    version="1.0.0",
    description=(
        "Deterministic statutory and tender compliance verification API for "
        "Government e-Marketplace procurement. Provides rule engine, scoring, "
        "risk evaluation, advisory generation, and tamper-evident audit chain."
    ),
)

# Enable CORS — allow Express frontend dev server and any hosted origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router)

# Mount static assets if directory exists (for standalone deployment)
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


@app.get("/", include_in_schema=False)
def serve_index():
    """Serves the officer dashboard index page or API info."""
    index_file = STATIC_DIR / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return {
        "message": "GeM Bid Verification Platform — Python Rule Engine API",
        "docs": "/docs",
        "openapi": "/openapi.json",
        "frontend": "Run 'cd frontend && npm run dev' for the React UI on port 3000",
        "version": "1.0.0",
        "architecture": "FastAPI (rule engine) + Express/Vite (frontend)",
    }

