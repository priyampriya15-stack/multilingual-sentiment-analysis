"""
Dataset Upload and Management Endpoints.
"""

import uuid
import json
import io
import pandas as pd
from pathlib import Path
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.models.db_models import DatasetRecord
from backend.app.core.config import settings

router = APIRouter(prefix="/datasets", tags=["Datasets"])


@router.post("/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    dataset_name: str = Form(...),
    source: str = Form("User Upload"),
    license_info: str = Form("Open Access"),
    db: Session = Depends(get_db)
):
    """
    Upload and validate a CSV dataset file containing multilingual sentiment samples.
    """
    if not file.filename.endswith((".csv", ".tsv")):
        raise HTTPException(status_code=400, detail="Only CSV or TSV files are supported.")

    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File exceeds maximum upload limit of {settings.MAX_UPLOAD_SIZE_MB}MB.")

    try:
        df = pd.read_csv(io.BytesIO(content), encoding="utf-8")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV file: {str(e)}")

    if "text" not in df.columns:
        raise HTTPException(status_code=400, detail="Dataset must contain at least a 'text' column.")

    sample_count = len(df)
    lang_coverage = list(df["language"].dropna().unique()) if "language" in df.columns else ["auto-detect"]
    sentiment_dist = df["sentiment"].value_counts().to_dict() if "sentiment" in df.columns else {}

    dataset_id = str(uuid.uuid4())[:8]
    save_path = Path(settings.DATA_DIR) / "raw" / f"{dataset_id}_{file.filename}"
    save_path.parent.mkdir(parents=True, exist_ok=True)

    with open(save_path, "wb") as f:
        f.write(content)

    record = DatasetRecord(
        dataset_id=dataset_id,
        name=dataset_name,
        source=source,
        language_coverage=lang_coverage,
        sample_count=sample_count,
        sentiment_distribution=sentiment_dist,
        license_info=license_info,
        file_path=str(save_path)
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "dataset_id": record.dataset_id,
        "name": record.name,
        "sample_count": record.sample_count,
        "language_coverage": record.language_coverage,
        "sentiment_distribution": record.sentiment_distribution,
        "message": "Dataset uploaded and validated successfully."
    }


@router.get("")
def list_datasets(db: Session = Depends(get_db)):
    """List all registered datasets."""
    records = db.query(DatasetRecord).order_by(DatasetRecord.created_at.desc()).all()
    
    # Prepend the benchmark dataset
    eda_file = Path(settings.DATA_DIR) / "eda_summary.json"
    benchmark = {
        "dataset_id": "indic_benchmark_v1",
        "name": "Indian Languages Multilingual Sentiment Benchmark",
        "source": "AI4Bharat / Curated Indic Benchmark Corpus",
        "language_coverage": ["en", "hi", "ta", "te", "ml", "kn", "bn", "mr", "gu", "pa", "or", "as", "hi-en"],
        "sample_count": 1905,
        "license_info": "CC-BY 4.0 / Research Use",
        "status": "Processed & Split (Train: 1333, Val: 286, Test: 286)"
    }

    user_datasets = [
        {
            "dataset_id": r.dataset_id,
            "name": r.name,
            "source": r.source,
            "language_coverage": r.language_coverage,
            "sample_count": r.sample_count,
            "sentiment_distribution": r.sentiment_distribution,
            "license_info": r.license_info,
            "created_at": r.created_at.strftime("%Y-%m-%d %H:%M:%S")
        }
        for r in records
    ]

    return [benchmark] + user_datasets
