"""
Training Pipeline for Model A: Traditional Machine Learning Baseline.

Uses a Subword & Word N-gram TF-IDF Vectorizer with Multinomial Logistic Regression
and balanced class weighting to handle Indic agglutinative morphology and class balance.
"""

import sys
import time
import json
import joblib
import pandas as pd
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC
from sklearn.pipeline import FeatureUnion

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent.parent))

from ml.src.evaluation.metrics import compute_comprehensive_metrics


def train_baseline(
    train_path: str = "ml/data/processed/train.csv",
    test_path: str = "ml/data/processed/test.csv",
    output_dir: str = "ml/artifacts/tfidf_baseline"
):
    print("=" * 60)
    print("PHASE 3: TRAINING TRADITIONAL ML BASELINE (MODEL A)")
    print("=" * 60)

    # 1. Load data
    train_df = pd.read_csv(train_path, encoding="utf-8")
    test_df = pd.read_csv(test_path, encoding="utf-8")

    X_train, y_train = train_df["text"].astype(str), train_df["sentiment"].astype(str)
    X_test, y_test = test_df["text"].astype(str), test_df["sentiment"].astype(str)
    test_languages = test_df["language"].tolist()

    print(f"Loaded {len(X_train)} training samples and {len(X_test)} test samples.")

    # 2. Build Multilingual Subword + Word TF-IDF Vectorizer
    # Word n-grams (1-2) capture semantic tokens
    # Char n-grams (2-4) capture subwords and morphological inflections across Indic scripts
    print("Fitting multilingual Subword & Word TF-IDF Vectorizer...")
    start_time = time.time()
    
    word_vec = TfidfVectorizer(ngram_range=(1, 2), max_features=25000, sublinear_tf=True)
    char_vec = TfidfVectorizer(ngram_range=(2, 4), analyzer="char", max_features=35000, sublinear_tf=True)
    
    vectorizer = FeatureUnion([
        ("word", word_vec),
        ("char", char_vec)
    ])

    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)

    # 3. Train Logistic Regression with balanced class weights
    print("Training Multinomial Logistic Regression (L2, class_weight='balanced')...")
    model = LogisticRegression(
        C=2.0,
        max_iter=1000,
        class_weight="balanced",
        solver="lbfgs",
        random_state=42
    )
    model.fit(X_train_vec, y_train)
    training_time = time.time() - start_time
    print(f"Model training completed in {training_time:.2f} seconds.")

    # 4. Evaluate inference latency
    infer_start = time.time()
    y_pred = model.predict(X_test_vec)
    infer_time = time.time() - infer_start
    latency_per_sample_ms = (infer_time / len(X_test)) * 1000

    # 5. Compute comprehensive evaluation metrics
    eval_results = compute_comprehensive_metrics(
        y_true=y_test,
        y_pred=y_pred,
        languages=test_languages,
        latency_ms=latency_per_sample_ms,
        training_time_sec=training_time
    )

    print("\n--- Test Evaluation Results ---")
    print(f"Accuracy:        {eval_results['accuracy']:.4f}")
    print(f"Macro F1-Score:  {eval_results['macro_f1']:.4f}")
    print(f"Weighted F1:     {eval_results['weighted_f1']:.4f}")
    print(f"Inference Time:  {eval_results['inference_latency_ms']:.2f} ms/sample")
    print("\nPer-Class Breakdown:")
    for cls, m in eval_results["per_class"].items():
        print(f"  {cls:<9}: P={m['precision']:.3f}, R={m['recall']:.3f}, F1={m['f1_score']:.3f} (supp={m['support']})")

    # 6. Save model artifacts
    out_p = Path(output_dir)
    out_p.mkdir(parents=True, exist_ok=True)

    joblib.dump(model, out_p / "model.joblib")
    joblib.dump(vectorizer, out_p / "vectorizer.joblib")

    with open(out_p / "eval_metrics.json", "w", encoding="utf-8") as f:
        json.dump(eval_results, f, indent=2)

    metadata = {
        "model_id": "tfidf_baseline",
        "name": "TF-IDF + Logistic Regression",
        "architecture": "Subword & Word N-gram (Word 1-2, Char 2-4) TF-IDF + Multinomial Logistic Regression",
        "classes": list(model.classes_),
        "num_features": X_train_vec.shape[1],
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
    }

    with open(out_p / "metadata.json", "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"\nArtifacts successfully saved to {out_p.resolve()}/")
    return model, vectorizer, eval_results


if __name__ == "__main__":
    train_baseline()
