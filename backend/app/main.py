"""
Main FastAPI Application Entrypoint.

Title: Multilingual Sentiment Analysis for Indian Languages Using Transformer-Based Models
"""

import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.core.config import settings
from backend.app.database.session import init_db
from backend.app.api import health, predict, analytics, experiments, datasets


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle startup and shutdown hooks."""
    print("Initializing database tables...")
    init_db()
    print("Application startup complete.")
    yield
    print("Application shutdown.")


app = FastAPI(
    title="Multilingual Sentiment Analysis for Indian Languages",
    description="Research-oriented NLP system for classifying sentiment across 12 Indian languages, code-mixed text, and multilingual transformers.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time-Ms"] = str(round(process_time * 1000, 2))
    return response


# Include Routers with standard /api prefix
app.include_router(health.router, prefix="/api")
app.include_router(predict.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(experiments.router, prefix="/api")
app.include_router(datasets.router, prefix="/api")


@app.get("/")
def root():
    return {
        "title": "Multilingual Sentiment Analysis for Indian Languages API",
        "version": "1.0.0",
        "docs_url": "/docs",
        "health_check": "/api/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
