"""FastAPI application entry point for the GeM Bid Verification Platform."""

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
    description="Deterministic statutory and tender compliance verification API for Government e-Marketplace procurement.",
)

# Enable CORS for development & demo integrations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router)

# Mount static assets if directory exists
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


@app.get("/", include_in_schema=False)
def serve_index():
    """Serves the officer dashboard index page."""
    index_file = STATIC_DIR / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return {"message": "GeM Bid Verification Platform API is running. Visit /docs for OpenAPI documentation."}
