"""
Research Experiment Execution and Management Endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List

from backend.app.database.session import get_db
from backend.app.schemas.api_schemas import RunExperimentRequest, ExperimentResponse
from backend.app.services.experiment_service import ExperimentService
from backend.app.models.db_models import ExperimentRecord

router = APIRouter(prefix="/experiments", tags=["Research Experiments"])


@router.post("/run", response_model=ExperimentResponse)
def launch_experiment(
    req: RunExperimentRequest,
    db: Session = Depends(get_db)
):
    """
    Launch a research experiment.
    Types:
    - model_comparison
    - cross_language
    - codemixed
    - low_resource
    """
    record = ExperimentService.run_experiment(
        experiment_type=req.experiment_type,
        name=req.name,
        model_id=req.model_id,
        parameters=req.parameters or {},
        db=db
    )
    return ExperimentResponse(
        experiment_id=record.experiment_id,
        name=record.name,
        research_question=record.research_question,
        model_id=record.model_id,
        status=record.status,
        parameters=record.parameters,
        metrics=record.metrics,
        error_message=record.error_message,
        start_time=record.start_time,
        completion_time=record.completion_time
    )


@router.get("", response_model=List[ExperimentResponse])
def list_experiments(db: Session = Depends(get_db)):
    """List all registered and completed experiments."""
    records = db.query(ExperimentRecord).order_by(ExperimentRecord.start_time.desc()).all()
    return [
        ExperimentResponse(
            experiment_id=r.experiment_id,
            name=r.name,
            research_question=r.research_question,
            model_id=r.model_id,
            status=r.status,
            parameters=r.parameters,
            metrics=r.metrics,
            error_message=r.error_message,
            start_time=r.start_time,
            completion_time=r.completion_time
        )
        for r in records
    ]


@router.get("/{experiment_id}", response_model=ExperimentResponse)
def get_experiment(experiment_id: str, db: Session = Depends(get_db)):
    """Retrieve full metrics and details of a specific experiment."""
    record = db.query(ExperimentRecord).filter(ExperimentRecord.experiment_id == experiment_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Experiment not found.")

    return ExperimentResponse(
        experiment_id=record.experiment_id,
        name=record.name,
        research_question=record.research_question,
        model_id=record.model_id,
        status=record.status,
        parameters=record.parameters,
        metrics=record.metrics,
        error_message=record.error_message,
        start_time=record.start_time,
        completion_time=record.completion_time
    )
