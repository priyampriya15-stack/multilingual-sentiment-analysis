# Implementation Plan: Multilingual Sentiment Analysis for Indian Languages

## Project Overview
A complete, research-oriented multilingual sentiment analysis system supporting 12 Indian languages (Hindi, Tamil, Telugu, Malayalam, Kannada, Bengali, Marathi, Gujarati, Punjabi, Odia, Assamese, English) plus code-mixed Hinglish/Tanglish. The platform compares traditional ML baselines with multilingual transformers (XLM-RoBERTa, IndicBERT), features an automated language detection module, provides confidence scoring with uncertainty calibration, and delivers a modern interactive React dashboard with a robust FastAPI backend.

---

## 1. Directory Structure
```
multilingual-sentiment-analysis/
├── frontend/                     # React + Vite + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/           # UI cards, charts, nav, badges, tables
│   │   ├── pages/                # 9 complete pages
│   │   ├── layouts/              # Main layout, sidebar, header
│   │   ├── services/             # Axios API client & services
│   │   ├── types/                # TypeScript schemas & interfaces
│   │   └── utils/                # Formatting, language helpers
│   ├── package.json
│   └── vite.config.ts
├── backend/                      # FastAPI application
│   ├── app/
│   │   ├── main.py               # FastAPI entrypoint & middleware
│   │   ├── api/                  # Endpoints (predict, batch, analytics, experiments, datasets)
│   │   ├── core/                 # Config, settings, logging
│   │   ├── database/             # SQLAlchemy engine & session
│   │   ├── models/               # ORM models (Prediction, Dataset, Experiment)
│   │   ├── schemas/              # Pydantic request/response schemas
│   │   └── services/             # InferenceService, LanguageDetector, ExperimentRunner
│   ├── tests/                    # Pytest test suite
│   └── requirements.txt
├── ml/                           # ML Pipeline & Research
│   ├── configs/                  # languages.json, models.json, train_config.json
│   ├── data/                     # raw, processed, splits, eda_summary.json
│   ├── notebooks/                # exploratory_data_analysis.ipynb
│   ├── scripts/                  # Data preparation, EDA generation, training runners
│   ├── src/
│   │   ├── data/                 # Ingestion, validation, splitting
│   │   ├── preprocessing/        # Unicode norm, cleaning, tokenization
│   │   ├── language_detection/   # Unicode block detector + fallback
│   │   ├── training/             # Baseline (TF-IDF) & Transformer trainers
│   │   ├── evaluation/           # Metrics calculation & confusion matrix
│   │   ├── inference/            # Model inference engine
│   │   └── experiments/          # Experiments 1 to 6
│   └── artifacts/                # Saved models, vectorizers, metrics
├── reports/                      # Academic research paper & diagrams
│   └── PROJECT_REPORT.md
├── docs/                         # API documentation, architecture guide
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## 2. Phase-by-Phase Execution Roadmap

- **Phase 1: Environment & Architecture Foundations**
  - Pin configurations for 12 Indian languages + English + Hinglish in `ml/configs/languages.json`.
  - Define model configurations in `ml/configs/models.json`.
  - Create directory structure and base requirements.

- **Phase 2: Dataset Collection, Preprocessing & EDA**
  - Implement normalized multilingual dataset ingestion (`text`, `language`, `sentiment`, `source`, `split`, `sample_id`).
  - Create genuine Indic language samples covering Positive, Negative, Neutral across all 12 languages and code-mixed text.
  - Implement preprocessing pipeline: Unicode normalization, punctuation cleaning, emoji preservation, stratified train/val/test splitting.
  - Implement deterministic Unicode-based Language Detector with phonetic Hinglish detection.
  - Generate exploratory data analysis (EDA) notebook and export summary metrics to `ml/data/eda_summary.json`.

- **Phase 3: Traditional ML Baseline (Model A)**
  - Implement Multilingual TF-IDF + Logistic Regression / Linear SVM.
  - Train on stratified multilingual corpus.
  - Save model checkpoint, vectorizer, and evaluation metrics in `ml/artifacts/tfidf_baseline/`.

- **Phase 4: Multilingual Transformer Models (Model B & C)**
  - Implement PyTorch fine-tuning and inference pipelines for multilingual transformers (XLM-RoBERTa, IndicBERT).
  - Train sequence classification heads with class-weighted loss.
  - Save checkpoints, tokenizers, label mappings, and test metrics in `ml/artifacts/`.

- **Phase 5: FastAPI Backend & SQLite Database**
  - Implement SQLAlchemy models: `PredictionHistory`, `DatasetRegistry`, `ExperimentRegistry`.
  - Implement Pydantic validation schemas.
  - Implement Singleton `SentimentInferenceService` with cached model weights.
  - Implement endpoints: `/api/health`, `/api/languages`, `/api/models`, `/api/metrics`, `/api/predict`, `/api/predict/batch`, `/api/datasets/upload`, `/api/analytics/*`, `/api/experiments/*`.

- **Phase 6: Modern React 19 Frontend Dashboard**
  - Setup Vite + TypeScript + Tailwind CSS with responsive dark/light palette, glassmorphism, micro-animations.
  - Implement 9 distinct pages:
    1. Overview Dashboard
    2. Sentiment Analyzer
    3. Batch Analysis
    4. Language Analytics
    5. Model Comparison
    6. Dataset Explorer
    7. Research Lab
    8. Prediction History
    9. Documentation & Setup

- **Phase 7: Research Experiments Framework**
  - Implement automated reproducible experiment scripts for Experiments 1-6.
  - Compute accuracy, macro F1, confusion matrices, latency, cross-lingual transfer gaps, and error analysis.

- **Phase 8: Automated Testing & Containerization**
  - Write comprehensive `pytest` test suite for preprocessing, language detection, prediction, API endpoints, and database.
  - Build `Dockerfile` and `docker-compose.yml`.

- **Phase 9: Comprehensive Project Report & Verification**
  - Write `reports/PROJECT_REPORT.md` (22 academic sections with methodology, diagrams, tables, and verifiable academic references).
  - Write detailed `README.md` with exact startup commands.
