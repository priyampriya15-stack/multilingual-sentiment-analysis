"""
Health and Metadata Endpoints.
"""

import json
from pathlib import Path
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from backend.app.core.config import settings
from backend.app.database.session import get_db
from backend.app.schemas.api_schemas import HealthResponse

router = APIRouter(tags=["Health & Metadata"])


@router.get("/health", response_model=HealthResponse)
def get_health(db: Session = Depends(get_db)):
    """Check service health and database connectivity."""
    db_connected = False
    try:
        db.execute(text("SELECT 1"))
        db_connected = True
    except Exception:
        db_connected = False

    return HealthResponse(
        status="ok",
        environment=settings.ENVIRONMENT,
        default_model=settings.DEFAULT_MODEL,
        available_models=["tfidf_baseline", "xlm_roberta", "indicbert"],
        device=settings.DEVICE,
        database_connected=db_connected
    )


@router.get("/languages")
def get_languages():
    """Return all supported Indian languages, scripts, and sample sentences."""
    lang_file = Path(settings.CONFIGS_DIR) / "languages.json"
    if lang_file.exists():
        with open(lang_file, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"supported_languages": []}


@router.get("/models")
def get_models():
    """Return configured model architectures, parameters, and metadata."""
    models_file = Path(settings.CONFIGS_DIR) / "models.json"
    if models_file.exists():
        with open(models_file, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"models": []}


@router.get("/metrics")
def get_metrics():
    """Return active evaluation metrics for the default baseline model."""
    metrics_file = Path(settings.MODEL_ARTIFACTS_DIR) / "tfidf_baseline" / "eval_metrics.json"
    if metrics_file.exists():
        with open(metrics_file, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}
