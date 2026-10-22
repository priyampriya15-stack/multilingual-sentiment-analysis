"""
Automated Integration Tests for FastAPI Endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database.session import init_db

# Initialize database tables for testing
init_db()

client = TestClient(app)


def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "tfidf_baseline" in data["available_models"]
    assert data["database_connected"] is True


def test_languages_endpoint():
    res = client.get("/api/languages")
    assert res.status_code == 200
    data = res.json()
    assert "supported_languages" in data
    assert len(data["supported_languages"]) >= 12


def test_models_endpoint():
    res = client.get("/api/models")
    assert res.status_code == 200
    data = res.json()
    assert "models" in data
    assert len(data["models"]) >= 3


def test_predict_single_text():
    payload = {
        "text": "यह सेवा वास्तव में अद्भुत और बहुत ही उपयोगी है!",
        "language_override": "hi",
        "model_id": "tfidf_baseline"
    }
    res = client.post("/api/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "prediction_id" in data
    assert data["detected_language"] == "hi"
    assert data["predicted_sentiment"] in ["Positive", "Negative", "Neutral"]
    assert "probabilities" in data
    assert data["confidence"] > 0.0
    assert data["inference_time_ms"] >= 0.0


def test_predict_batch():
    payload = {
        "items": [
            {"id": "1", "text": "This product is fantastic and exceeded expectations!"},
            {"id": "2", "text": "Terrible customer service and broken item."},
            {"id": "3", "text": "The train leaves at 9 AM tomorrow morning."}
        ],
        "model_id": "tfidf_baseline"
    }
    res = client.post("/api/predict/batch", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["total_processed"] == 3
    assert len(data["results"]) == 3
    assert "sentiment_summary" in data


def test_analytics_overview():
    res = client.get("/api/analytics/overview")
    assert res.status_code == 200
    data = res.json()
    assert "total_analyzed_texts" in data
    assert "supported_languages_count" in data
    assert "sentiment_distribution" in data


def test_analytics_model_comparison():
    res = client.get("/api/analytics/model-comparison")
    assert res.status_code == 200
    data = res.json()
    assert "models" in data
    assert len(data["models"]) >= 1


def test_predict_empty_text_validation_error():
    payload = {"text": ""}
    res = client.post("/api/predict", json=payload)
    assert res.status_code == 422  # Pydantic validation error for min_length=1
