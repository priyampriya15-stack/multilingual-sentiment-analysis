"""
SQLAlchemy ORM Models for Prediction History, Datasets, and Experiments.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON, Boolean
from backend.app.database.session import Base


class PredictionRecord(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    prediction_id = Column(String(64), unique=True, index=True, nullable=False)
    text = Column(Text, nullable=False)
    detected_language = Column(String(32), nullable=False, index=True)
    language_confidence = Column(Float, default=1.0)
    predicted_sentiment = Column(String(32), nullable=False, index=True)
    confidence = Column(Float, nullable=False)
    probabilities = Column(JSON, nullable=True)
    model_name = Column(String(64), nullable=False, index=True)
    is_uncertain = Column(Boolean, default=False)
    inference_time_ms = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class DatasetRecord(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    dataset_id = Column(String(64), unique=True, index=True, nullable=False)
    name = Column(String(128), nullable=False)
    source = Column(String(128), default="Custom Upload")
    language_coverage = Column(JSON, nullable=False)  # list of language codes
    sample_count = Column(Integer, nullable=False)
    sentiment_distribution = Column(JSON, nullable=True)
    license_info = Column(String(128), default="Open Access / CC-BY")
    file_path = Column(String(256), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class ExperimentRecord(Base):
    __tablename__ = "experiments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    experiment_id = Column(String(64), unique=True, index=True, nullable=False)
    name = Column(String(128), nullable=False)
    research_question = Column(String(256), nullable=False)
    model_id = Column(String(64), nullable=False)
    dataset_id = Column(String(64), default="default_corpus")
    status = Column(String(32), default="Pending", index=True)  # Pending, Running, Completed, Failed
    parameters = Column(JSON, nullable=True)
    metrics = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    start_time = Column(DateTime, default=datetime.utcnow)
    completion_time = Column(DateTime, nullable=True)
