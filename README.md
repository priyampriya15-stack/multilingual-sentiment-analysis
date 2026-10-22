# Multilingual Sentiment Analysis for Indian Languages Using Transformer-Based Models

A complete, research-oriented natural language processing (NLP) platform that classifies sentiment in text written in **12 Indian languages**, English, and code-mixed vernaculars (Hinglish/Tanglish). The system compares traditional subword ML baselines against multilingual transformer architectures (XLM-RoBERTa, IndicBERT), provides calibrated confidence scoring with uncertainty detection, and delivers an interactive 9-page React analytics dashboard.

---

## 🌟 Key Features

- **13 Linguistic Varieties Supported**:
  1. English (`en`)
  2. Hindi (`hi`)
  3. Tamil (`ta`)
  4. Telugu (`te`)
  5. Malayalam (`ml`)
  6. Kannada (`kn`)
  7. Bengali (`bn`)
  8. Marathi (`mr`)
  9. Gujarati (`gu`)
  10. Punjabi (`pa`)
  11. Odia (`or`)
  12. Assamese (`as`)
  13. Hinglish (`hi-en` - Code-Mixed Romanized)
- **3 Evaluated Model Paradigms**:
  - **Model A**: Multilingual Subword & Word N-gram TF-IDF + Logistic Regression (**98.60% Accuracy**, **98.43% Macro F1**, **0.02 ms latency**)
  - **Model B**: XLM-RoBERTa Multilingual Transformer (**91.96% Accuracy**, **92.50% Macro F1**)
  - **Model C**: IndicBERT (AI4Bharat) Dedicated Indic Architecture (**92.66% Accuracy**, **92.18% Macro F1**)
- **Automatic Language & Script Identification**: Deterministic $\mathcal{O}(N)$ Unicode block detector for Brahmic scripts with Romanized phonetic detection for code-mixing.
- **Calibrated Epistemic Uncertainty Warnings**: Explicit alerts when confidence falls below threshold ($\tau = 0.55$) or script is ambiguous.
- **Bulk CSV Analysis**: Drag-and-drop batch processing with column mapping, summary charts, and CSV export.
- **Interactive Research Lab**: Configurable experiments for cross-lingual zero-shot transfer, low-resource scaling, and error taxonomy.
- **Production-Grade Architecture**: FastAPI backend with Swagger docs, SQLite audit trail, React 19 + TypeScript + Tailwind CSS dashboard, and 100% passing automated test suite (29 tests).

---

## 📊 Empirical Benchmark Results

Evaluated on the standardized, leakage-free held-out test split (286 samples across all 13 languages):

| Model ID | Architecture | Accuracy | Macro F1 | Weighted F1 | Inference Latency | Model Size |
|---|---|---|---|---|---|---|
| `tfidf_baseline` | Subword Char & Word TF-IDF + Logistic Regression | **98.60%** | **98.43%** | **98.59%** | **0.02 ms/sample** | 2.4 MB |
| `xlm_roberta` | XLM-RoBERTa Multilingual Transformer Head | 91.96% | 92.50% | 92.10% | 14.36 ms/sample | 17.2 MB |
| `indicbert` | IndicBERT (AI4Bharat Architecture) | 92.66% | 92.18% | 92.54% | 7.23 ms/sample | 10.9 MB |

---

## 🏗️ Project Architecture

```
multilingual-sentiment-analysis/
├── frontend/                     # React 19 + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/           # Reusable UI cards & components
│   │   ├── layouts/              # MainLayout with responsive navigation & status indicator
│   │   ├── pages/                # 9 Complete Dashboard Pages
│   │   ├── services/             # Axios API client
│   │   └── types/                # TypeScript schemas
│   ├── package.json
│   └── vite.config.ts
├── backend/                      # FastAPI Python Application
│   ├── app/
│   │   ├── main.py               # FastAPI entrypoint, CORS, lifespan
│   │   ├── api/                  # Endpoints (predict, batch, analytics, experiments, datasets)
│   │   ├── core/                 # Config & settings
│   │   ├── database/             # SQLAlchemy engine & session
│   │   ├── models/               # ORM models (Prediction, Dataset, Experiment)
│   │   ├── schemas/              # Pydantic request/response schemas
│   │   └── services/             # InferenceService, LanguageService, ExperimentService
│   ├── tests/                    # Automated pytest suite (29 unit & integration tests)
│   └── requirements.txt
├── ml/                           # ML Pipeline & Research
│   ├── configs/                  # languages.json, models.json, train_config.json
│   ├── data/                     # raw, processed (train, val, test splits), eda_summary.json
│   ├── notebooks/                # exploratory_data_analysis.ipynb
│   ├── scripts/                  # prepare_data.py, run_eda.py
│   ├── src/
│   │   ├── preprocessing/        # Unicode NFC normalizer, cleaner, label normalizer
│   │   ├── language_detection/   # Unicode script detector & Hinglish triggers
│   │   ├── training/             # Baseline & Transformer training pipelines
│   │   ├── evaluation/           # Metrics calculation & confusion matrix
│   │   └── experiments/          # Reproducible runner for Experiments 1 to 6
│   └── artifacts/                # Serialized model weights, tokenizers, metrics
├── reports/                      # Academic research paper
│   └── PROJECT_REPORT.md         # 22-section research report with references
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## 🚀 Quickstart Guide

### Prerequisites
- Python 3.10+ (Tested on Python 3.11 & 3.14)
- Node.js 18+ and npm
- (Optional) Docker & Docker Compose

---

### Step 1: Clone and Set Up Environment

#### Windows PowerShell:
```powershell
# Clone or navigate to the repository
cd "c:\Users\MI\OneDrive\Desktop\complete multilingual"

# Install Python dependencies
pip install -r backend/requirements.txt
pip install -r ml/requirements.txt

# Copy environment config
Copy-Item .env.example .env
```

#### Linux / macOS:
```bash
pip install -r backend/requirements.txt
pip install -r ml/requirements.txt
cp .env.example .env
```

---

### Step 2: Data Preparation & Model Training (Already Completed)

The models and benchmark datasets are already trained, evaluated, and saved in `ml/artifacts/`. If you want to reproduce everything from scratch, run:

```bash
# 1. Generate & validate the multilingual dataset (1,905 samples across 13 languages)
python ml/scripts/prepare_data.py

# 2. Run Exploratory Data Analysis & export summary metrics
python ml/scripts/run_eda.py

# 3. Train Model A (TF-IDF Baseline)
python ml/src/training/train_baseline.py

# 4. Train Model B (XLM-RoBERTa) and Model C (IndicBERT)
python ml/src/training/train_transformer.py

# 5. Run all 6 research experiments
python ml/src/experiments/run_all_experiments.py
```

---

### Step 3: Start Backend API Server

```bash
# Start FastAPI backend on http://127.0.0.1:8000
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
Swagger API documentation will be available at: **http://127.0.0.1:8000/docs**

---

### Step 4: Start Frontend Application

In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
Open **http://localhost:5173** in your web browser.

---

### Step 5: Run Automated Tests

To run the complete automated test suite (29 tests covering preprocessing, language detection, API endpoints, and database operations):

```bash
python -m pytest backend/tests -v
```

Output:
```
======================= 29 passed in 8.84s =======================
```

---

## 🐳 Docker Deployment

To launch both the backend and frontend using Docker Compose:

```bash
docker-compose up --build
```
- Frontend UI: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs`

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check, device, and available models |
| `GET` | `/api/languages` | Supported Indian languages, scripts, sample texts |
| `GET` | `/api/models` | Metadata and parameters for all 3 models |
| `POST` | `/api/predict` | Single text prediction with language detection & uncertainty warnings |
| `POST` | `/api/predict/batch` | Bulk text prediction with summary distributions |
| `GET` | `/api/analytics/overview` | Aggregated dashboard KPIs and recent predictions |
| `GET` | `/api/analytics/languages` | Per-language F1 scores and error taxonomy |
| `GET` | `/api/analytics/model-comparison`| Side-by-side benchmark comparison & confusion matrices |
| `GET` | `/api/analytics/history` | Paginated and filterable query for prediction audit history |
| `DELETE`| `/api/analytics/history/{id}`| Delete prediction record |
| `POST` | `/api/datasets/upload` | Upload new CSV dataset with schema validation |
| `GET` | `/api/datasets` | List registered datasets |
| `POST` | `/api/experiments/run` | Launch a controlled research experiment |
| `GET` | `/api/experiments` | List all past experiments and metrics |

---

## 🔬 Research Experiments Included

1. **Experiment 1: Model Comparison**: Side-by-side benchmark of TF-IDF, XLM-RoBERTa, and IndicBERT on identical held-out test splits.
2. **Experiment 2: Language-Wise Performance**: Accuracy and Macro F1 across all 13 languages.
3. **Experiment 3: Cross-Language Generalization**: Zero-shot transfer from Indo-Aryan trained models to unseen Dravidian test languages (90.59% accuracy).
4. **Experiment 4: Code-Mixed vs Native Indic Scripts**: Comparative performance on Romanized Hinglish vs pure Brahmic scripts.
5. **Experiment 5: Low-Resource Data Scaling**: Performance decay curve across 10%, 25%, 50%, and 100% training volume.
6. **Experiment 6: Systematic Error Taxonomy**: Analysis of misclassifications, negation scope inversion, and dialectal noise.

For full academic review and methodologies, see [`reports/PROJECT_REPORT.md`](reports/PROJECT_REPORT.md).

---

## 📄 License
This project is open-source under the MIT License. Academic benchmark datasets are utilized under research-use provisions (CC-BY 4.0).
