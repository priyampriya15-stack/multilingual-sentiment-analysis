"""
Application Configuration and Settings.
"""

import os
from pathlib import Path
from pydantic_settings import BaseSettings

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent.parent.parent


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "127.0.0.1"
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"

    DATABASE_URL: str = "sqlite:///./sentiment.db"

    DEFAULT_MODEL: str = "tfidf_baseline"
    MODEL_ARTIFACTS_DIR: str = str(WORKSPACE_ROOT / "ml" / "artifacts")
    DATA_DIR: str = str(WORKSPACE_ROOT / "ml" / "data")
    CONFIGS_DIR: str = str(WORKSPACE_ROOT / "ml" / "configs")
    DEVICE: str = "cpu"
    
    CONFIDENCE_THRESHOLD: float = 0.55
    UNCERTAINTY_FLAG_ENABLED: bool = True
    
    MAX_UPLOAD_SIZE_MB: int = 25
    MAX_BATCH_SIZE: int = 2000
    MAX_TEXT_LENGTH: int = 2000

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
