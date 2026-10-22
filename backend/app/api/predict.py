"""
Prediction Endpoints for Single Text and Batch Inference.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from backend.app.database.session import get_db
from backend.app.schemas.api_schemas import (
    PredictRequest,
    PredictResponse,
    BatchPredictRequest,
    BatchPredictResponse
)
from backend.app.services.inference_service import InferenceService
from backend.app.models.db_models import PredictionRecord

router = APIRouter(tags=["Prediction"])


@router.post("/predict", response_model=PredictResponse)
def predict_sentiment(req: PredictRequest, db: Session = Depends(get_db)):
    """
    Classify the sentiment of a single text input.
    - Automatically detects language and script.
    - Allows manual language and model overrides.
    - Returns confidence score, probability distribution, and epistemic uncertainty warnings.
    - Persists prediction to database history.
    """
    inference_service = InferenceService()

    try:
        result = inference_service.predict(
            raw_text=req.text,
            language_override=req.language_override,
            model_id=req.model_id
        )
    except FileNotFoundError as fnf:
        raise HTTPException(status_code=503, detail=str(fnf))
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

    # Persist to database history
    record = PredictionRecord(
        prediction_id=result["prediction_id"],
        text=result["text"],
        detected_language=result["detected_language"],
        language_confidence=result["language_confidence"],
        predicted_sentiment=result["predicted_sentiment"],
        confidence=result["confidence"],
        probabilities=result["probabilities"],
        model_name=result["selected_model"],
        is_uncertain=result["is_uncertain"],
        inference_time_ms=result["inference_time_ms"]
    )
    db.add(record)
    db.commit()

    return PredictResponse(**result)


@router.post("/predict/batch", response_model=BatchPredictResponse)
def predict_batch(req: BatchPredictRequest, db: Session = Depends(get_db)):
    """
    Batch classification for lists of texts (or parsed CSV rows).
    """
    if len(req.items) > 2000:
        raise HTTPException(status_code=400, detail="Batch size exceeds maximum limit of 2,000 items.")

    inference_service = InferenceService()
    results = []
    sentiment_counts = {"Positive": 0, "Negative": 0, "Neutral": 0}
    lang_counts = {}
    total_time = 0.0

    db_records = []

    for item in req.items:
        try:
            res = inference_service.predict(
                raw_text=item.text,
                language_override=item.language,
                model_id=req.model_id
            )
            results.append(PredictResponse(**res))
            
            s = res["predicted_sentiment"]
            sentiment_counts[s] = sentiment_counts.get(s, 0) + 1

            l = res["detected_language"]
            lang_counts[l] = lang_counts.get(l, 0) + 1

            total_time += res["inference_time_ms"]

            db_records.append(PredictionRecord(
                prediction_id=res["prediction_id"],
                text=res["text"],
                detected_language=res["detected_language"],
                language_confidence=res["language_confidence"],
                predicted_sentiment=res["predicted_sentiment"],
                confidence=res["confidence"],
                probabilities=res["probabilities"],
                model_name=res["selected_model"],
                is_uncertain=res["is_uncertain"],
                inference_time_ms=res["inference_time_ms"]
            ))
        except Exception as e:
            continue

    if db_records:
        db.add_all(db_records)
        db.commit()

    avg_time = round(total_time / max(len(results), 1), 2)

    return BatchPredictResponse(
        total_processed=len(results),
        sentiment_summary=sentiment_counts,
        language_summary=lang_counts,
        avg_inference_time_ms=avg_time,
        results=results
    )
