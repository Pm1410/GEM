# GeM Bid Eligibility Verification Platform (SIH26100)
# Production Container Specification — Designed for Sovereign On-Premises Deployment

FROM python:3.12-slim

# Prevent Python from writing .pyc files and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app/src

WORKDIR /app

# Install system dependencies for OCR, image deskewing, and database healthchecks
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python package dependencies
COPY pyproject.toml /app/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir .

# Copy project configuration, source code, and migration definitions
COPY config/ /app/config/
COPY src/ /app/src/
COPY alembic.ini /app/alembic.ini

# Expose API port
EXPOSE 8000

# Healthcheck probe for orchestrators
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

# Default ASGI server execution
CMD ["uvicorn", "gem_api.main:app", "--host", "0.0.0.0", "--port", "8000"]
