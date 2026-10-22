"""
Automated Database Operations Tests.
"""

import uuid
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.database.session import Base
from backend.app.models.db_models import PredictionRecord, DatasetRecord, ExperimentRecord

TEST_DB_URL = "sqlite:///:memory:"


@pytest.fixture
def db_session():
    engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        yield session
    finally:
        session.close()


def test_insert_and_query_prediction(db_session):
    pred_id = str(uuid.uuid4())[:8]
    record = PredictionRecord(
        prediction_id=pred_id,
        text="இந்த திரைப்படம் மிகவும் அருமையாக உள்ளது",
        detected_language="ta",
        predicted_sentiment="Positive",
        confidence=0.98,
        probabilities={"Positive": 0.98, "Negative": 0.01, "Neutral": 0.01},
        model_name="tfidf_baseline",
        inference_time_ms=0.04
    )
    db_session.add(record)
    db_session.commit()

    queried = db_session.query(PredictionRecord).filter_by(prediction_id=pred_id).first()
    assert queried is not None
    assert queried.text == "இந்த திரைப்படம் மிகவும் அருமையாக உள்ளது"
    assert queried.detected_language == "ta"
    assert queried.predicted_sentiment == "Positive"
    assert queried.confidence == 0.98


def test_insert_and_query_dataset(db_session):
    ds_id = str(uuid.uuid4())[:8]
    ds = DatasetRecord(
        dataset_id=ds_id,
        name="Indic Corpus Test",
        source="AI4Bharat",
        language_coverage=["hi", "ta", "te"],
        sample_count=300
    )
    db_session.add(ds)
    db_session.commit()

    queried = db_session.query(DatasetRecord).filter_by(dataset_id=ds_id).first()
    assert queried is not None
    assert queried.name == "Indic Corpus Test"
    assert "ta" in queried.language_coverage


def test_delete_prediction_record(db_session):
    pred_id = str(uuid.uuid4())[:8]
    record = PredictionRecord(
        prediction_id=pred_id,
        text="Sample text to delete",
        detected_language="en",
        predicted_sentiment="Neutral",
        confidence=0.85,
        model_name="tfidf_baseline"
    )
    db_session.add(record)
    db_session.commit()

    # Verify exists
    assert db_session.query(PredictionRecord).filter_by(prediction_id=pred_id).first() is not None

    # Delete
    db_session.delete(record)
    db_session.commit()

    # Verify deleted
    assert db_session.query(PredictionRecord).filter_by(prediction_id=pred_id).first() is None
