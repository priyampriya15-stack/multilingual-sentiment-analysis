"""
Pydantic Schemas for API Requests, Responses, and Analytics.
"""

from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field
from datetime import datetime


# --- Prediction Schemas ---

class PredictRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000, description="Input text to classify sentiment")
    language_override: Optional[str] = Field(None, description="Optional manual language code override (e.g. 'hi', 'ta', 'en')")
    model_id: Optional[str] = Field(None, description="Optional model identifier ('tfidf_baseline', 'xlm_roberta', 'indicbert')")


class PredictResponse(BaseModel):
    prediction_id: str
    text: str
    detected_language: str
    language_name: str
    script: str
    language_confidence: float
    selected_model: str
    predicted_sentiment: str
    confidence: float
    probabilities: Dict[str, float]
    is_uncertain: bool
    uncertainty_reason: Optional[str] = None
    inference_time_ms: float


class BatchPredictItem(BaseModel):
    id: Optional[str] = None
    text: str
    language: Optional[str] = None


class BatchPredictRequest(BaseModel):
    items: List[BatchPredictItem]
    model_id: Optional[str] = None


class BatchPredictResponse(BaseModel):
    total_processed: int
    sentiment_summary: Dict[str, int]
    language_summary: Dict[str, int]
    avg_inference_time_ms: float
    results: List[PredictResponse]


# --- Health & Metadata Schemas ---

class HealthResponse(BaseModel):
    status: str
    environment: str
    default_model: str
    available_models: List[str]
    device: str
    database_connected: bool


class LanguageItem(BaseModel):
    code: str
    name: str
    native_name: str
    script: str
    family: str
    dataset_availability: str
    model_compatibility: List[str]
    status: str
    samples: Dict[str, str]


class ModelInfo(BaseModel):
    id: str
    name: str
    type: str
    architecture: str
    parameters: str
    supported_languages: List[str]
    status: str
    description: str
    strengths: str
    limitations: str


# --- Experiment Schemas ---

class RunExperimentRequest(BaseModel):
    name: str
    experiment_type: str = Field(..., description="e.g. 'model_comparison', 'cross_language', 'codemixed', 'low_resource'")
    model_id: str
    parameters: Optional[Dict[str, Any]] = None


class ExperimentResponse(BaseModel):
    experiment_id: str
    name: str
    research_question: str
    model_id: str
    status: str
    parameters: Optional[Dict[str, Any]]
    metrics: Optional[Dict[str, Any]]
    error_message: Optional[str]
    start_time: datetime
    completion_time: Optional[datetime]

