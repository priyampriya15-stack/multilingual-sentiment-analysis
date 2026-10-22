"""
Model Inference Engine and Caching Service.

Manages singleton lifecycle for:
- Model A: Traditional ML Baseline (TF-IDF + Logistic Regression)
- Model B: XLM-RoBERTa Multilingual Transformer
- Model C: IndicBERT (AI4Bharat) Transformer

Loads weights ONCE on startup/demand, caches in memory, and provides
fast multi-class probability scoring with calibrated uncertainty detection.
"""

import os
import time
import uuid
import joblib
import torch
import torch.nn.functional as F
from pathlib import Path
from typing import Dict, Any, Optional, List, Tuple

from backend.app.core.config import settings
from backend.app.services.language_service import LanguageService
from ml.src.preprocessing.cleaner import clean_text
from ml.src.training.transformer_model import MultilingualTransformerClassifier
from ml.src.training.multilingual_tokenizer import MultilingualTokenizer

CLASSES = ["Positive", "Negative", "Neutral"]


class InferenceService:
    _instance = None
    _models: Dict[str, Any] = {}
    _vectorizers: Dict[str, Any] = {}
    _tokenizers: Dict[str, Any] = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(InferenceService, cls).__new__(cls)
            cls._instance._init_service()
        return cls._instance

    def _init_service(self):
        self.device = torch.device(settings.DEVICE if torch.cuda.is_available() and settings.DEVICE == "cuda" else "cpu")
        self.artifacts_dir = Path(settings.MODEL_ARTIFACTS_DIR)
        print(f"Initializing InferenceService on device: {self.device}")
        
        # Eagerly load the default model (TF-IDF Baseline)
        try:
            self._load_tfidf_baseline()
        except Exception as e:
            print(f"Warning: Could not pre-load TF-IDF baseline: {e}")

    def _load_tfidf_baseline(self):
        """Load TF-IDF model and vectorizer into memory cache."""
        if "tfidf_baseline" not in self._models:
            model_path = self.artifacts_dir / "tfidf_baseline" / "model.joblib"
            vec_path = self.artifacts_dir / "tfidf_baseline" / "vectorizer.joblib"
            
            if not model_path.exists() or not vec_path.exists():
                raise FileNotFoundError(
                    f"TF-IDF baseline artifacts not found at {model_path}. "
                    "Run 'python ml/src/training/train_baseline.py' to generate artifacts."
                )
            
            self._models["tfidf_baseline"] = joblib.load(model_path)
            self._vectorizers["tfidf_baseline"] = joblib.load(vec_path)
            print("TF-IDF Baseline loaded into memory successfully.")

    def _load_transformer_model(self, model_id: str):
        """Load Transformer model and tokenizer into memory cache."""
        if model_id not in self._models:
            folder_name = "xlm_roberta_checkpoint" if model_id == "xlm_roberta" else "indicbert_checkpoint"
            chk_dir = self.artifacts_dir / folder_name
            model_path = chk_dir / "model.pt"
            vocab_path = chk_dir / "tokenizer_vocab.json"
            config_path = chk_dir / "config.json"

            if not model_path.exists() or not vocab_path.exists() or not config_path.exists():
                raise FileNotFoundError(
                    f"Model checkpoint for '{model_id}' was not found at {chk_dir}. "
                    f"Please run 'python ml/src/training/train_transformer.py' to train and save the checkpoint."
                )

            import json
            with open(config_path, "r", encoding="utf-8") as f:
                cfg = json.load(f)

            tokenizer = MultilingualTokenizer(vocab_file=str(vocab_path))
            
            model = MultilingualTransformerClassifier(
                vocab_size=cfg["vocab_size"],
                d_model=cfg["d_model"],
                nhead=cfg["nhead"],
                num_encoder_layers=cfg["num_encoder_layers"],
                dim_feedforward=cfg["dim_feedforward"],
                num_classes=cfg["num_classes"],
                max_seq_len=cfg["max_seq_len"],
                dropout=0.0
            ).to(self.device)

            model.load_state_dict(torch.load(model_path, map_location=self.device))
            model.eval()

            self._models[model_id] = model
            self._tokenizers[model_id] = tokenizer
            print(f"Transformer model '{model_id}' loaded into memory successfully.")

    def predict(
        self,
        raw_text: str,
        language_override: Optional[str] = None,
        model_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Perform end-to-end sentiment prediction:
        1. Language identification
        2. Text cleaning
        3. Model inference (TF-IDF or Transformer)
        4. Probability distribution & confidence score
        5. Uncertainty calibration check
        """
        start_time = time.time()
        selected_model = model_id or settings.DEFAULT_MODEL

        # 1. Language Detection
        lang_info = LanguageService.identify(raw_text, override=language_override)
        detected_lang = lang_info["language_code"]
        lang_confidence = lang_info["confidence"]

        # 2. Text Preprocessing
        cleaned = clean_text(raw_text)
        if not cleaned:
            return {
                "prediction_id": str(uuid.uuid4())[:8],
                "text": raw_text,
                "detected_language": detected_lang,
                "language_name": lang_info["language_name"],
                "script": lang_info["script"],
                "language_confidence": lang_confidence,
                "selected_model": selected_model,
                "predicted_sentiment": "Neutral",
                "confidence": 0.33,
                "probabilities": {"Positive": 0.333, "Negative": 0.333, "Neutral": 0.334},
                "is_uncertain": True,
                "uncertainty_reason": "Input text contains no valid linguistic content after cleaning.",
                "inference_time_ms": round((time.time() - start_time) * 1000, 2)
            }

        # 3. Model Inference
        probabilities = {}
        if selected_model == "tfidf_baseline":
            self._load_tfidf_baseline()
            model = self._models["tfidf_baseline"]
            vectorizer = self._vectorizers["tfidf_baseline"]

            X_vec = vectorizer.transform([cleaned])
            probs = model.predict_proba(X_vec)[0]
            classes = model.classes_
            
            for cls, p in zip(classes, probs):
                probabilities[cls] = round(float(p), 4)

        elif selected_model in ["xlm_roberta", "indicbert"]:
            self._load_transformer_model(selected_model)
            model = self._models[selected_model]
            tokenizer = self._tokenizers[selected_model]

            encoded = tokenizer.encode(cleaned, max_length=96)
            input_ids = torch.tensor([encoded["input_ids"]], dtype=torch.long).to(self.device)
            attention_mask = torch.tensor([encoded["attention_mask"]], dtype=torch.long).to(self.device)

            with torch.no_grad():
                logits = model(input_ids, attention_mask)
                probs = F.softmax(logits, dim=1).cpu().numpy()[0]

            for cls, p in zip(CLASSES, probs):
                probabilities[cls] = round(float(p), 4)
        else:
            raise ValueError(
                f"Unsupported model_id '{selected_model}'. "
                "Available models: ['tfidf_baseline', 'xlm_roberta', 'indicbert']."
            )

        # 4. Predict class and confidence
        top_sentiment = max(probabilities.items(), key=lambda x: x[1])[0]
        confidence = float(probabilities[top_sentiment])

        # 5. Uncertainty calibration check
        is_uncertain = False
        uncertainty_reason = None

        if confidence < settings.CONFIDENCE_THRESHOLD:
            is_uncertain = True
            uncertainty_reason = (
                f"Model confidence ({confidence:.2f}) is below threshold ({settings.CONFIDENCE_THRESHOLD}). "
                "Softmax output reflects high epistemic uncertainty; manual review recommended."
            )
        elif lang_info.get("is_uncertain", False):
            is_uncertain = True
            uncertainty_reason = (
                f"Input language script detection is borderline ({lang_info['language_name']} with confidence {lang_confidence:.2f}). "
                "Prediction may be impacted by dialectal or mixed-script characteristics."
            )

        inference_time_ms = round((time.time() - start_time) * 1000, 2)

        return {
            "prediction_id": str(uuid.uuid4())[:8],
            "text": raw_text,
            "detected_language": detected_lang,
            "language_name": lang_info["language_name"],
            "script": lang_info["script"],
            "language_confidence": lang_confidence,
            "selected_model": selected_model,
            "predicted_sentiment": top_sentiment,
            "confidence": confidence,
            "probabilities": probabilities,
            "is_uncertain": is_uncertain,
            "uncertainty_reason": uncertainty_reason,
            "inference_time_ms": inference_time_ms
        }
