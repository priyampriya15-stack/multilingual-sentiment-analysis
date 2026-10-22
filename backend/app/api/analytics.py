"""
Analytics and Prediction History Endpoints.
"""

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional

from backend.app.database.session import get_db
from backend.app.services.analytics_service import AnalyticsService
from backend.app.models.db_models import PredictionRecord

router = APIRouter(prefix="/analytics", tags=["Analytics & History"])


@router.get("/overview")
def get_overview(db: Session = Depends(get_db)):
    """Return top-level dashboard metrics, distributions, and recent predictions."""
    return AnalyticsService.get_overview(db)


@router.get("/languages")
def get_languages_analytics():
    """Return language-specific sample counts, macro F1, and error categories."""
    return AnalyticsService.get_language_analytics()


@router.get("/sentiment-distribution")
def get_sentiment_distribution(db: Session = Depends(get_db)):
    """Return sentiment distribution breakdown."""
    overview = AnalyticsService.get_overview(db)
    return {"distribution": overview["sentiment_distribution"]}


@router.get("/model-comparison")
def get_model_comparison():
    """Return comparative metrics, confusion matrices, and latency across all models."""
    return AnalyticsService.get_model_comparison()


@router.get("/history")
def get_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    search: Optional[str] = None,
    language: Optional[str] = None,
    sentiment: Optional[str] = None,
    model: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Paginated and filterable query for prediction audit history.
    """
    query = db.query(PredictionRecord)

    if search:
        query = query.filter(PredictionRecord.text.ilike(f"%{search}%"))
    if language:
        query = query.filter(PredictionRecord.detected_language == language)
    if sentiment:
        query = query.filter(PredictionRecord.predicted_sentiment == sentiment)
    if model:
        query = query.filter(PredictionRecord.model_name == model)

    total_count = query.count()
    records = (
        query.order_by(PredictionRecord.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = [
        {
            "id": r.id,
            "prediction_id": r.prediction_id,
            "text": r.text,
            "detected_language": r.detected_language,
            "language_confidence": r.language_confidence,
            "predicted_sentiment": r.predicted_sentiment,
            "confidence": r.confidence,
            "probabilities": r.probabilities,
            "model_name": r.model_name,
            "is_uncertain": r.is_uncertain,
            "inference_time_ms": r.inference_time_ms,
            "created_at": r.created_at.strftime("%Y-%m-%d %H:%M:%S")
        }
        for r in records
    ]

    return {
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": (total_count + page_size - 1) // page_size,
        "items": items
    }


@router.delete("/history/{prediction_id}")
def delete_prediction(prediction_id: str, db: Session = Depends(get_db)):
    """Delete a specific prediction from history."""
    record = db.query(PredictionRecord).filter(PredictionRecord.prediction_id == prediction_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Prediction not found.")

    db.delete(record)
    db.commit()
    return {"message": "Prediction deleted successfully", "prediction_id": prediction_id}
