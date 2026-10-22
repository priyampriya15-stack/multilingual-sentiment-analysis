"""
Comprehensive Evaluation Metrics Module.

Computes:
- Overall Accuracy
- Macro F1, Weighted F1
- Macro Precision & Recall, Weighted Precision & Recall
- Per-class precision, recall, f1-score, and support
- 3x3 Confusion Matrix
- Per-language performance breakdown (Accuracy, Macro F1, sample count)
- Latency metrics
"""

from typing import List, Dict, Any, Union
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    precision_recall_fscore_support,
    confusion_matrix,
    classification_report
)

CLASSES = ["Positive", "Negative", "Neutral"]


def compute_comprehensive_metrics(
    y_true: Union[List[str], np.ndarray],
    y_pred: Union[List[str], np.ndarray],
    languages: Union[List[str], np.ndarray] = None,
    latency_ms: float = None,
    training_time_sec: float = None
) -> Dict[str, Any]:
    """Calculate complete research-grade metrics across classes and languages."""
    y_true = list(y_true)
    y_pred = list(y_pred)

    # 1. Overall Metrics
    acc = float(accuracy_score(y_true, y_pred))
    
    macro_p, macro_r, macro_f1, _ = precision_recall_fscore_support(
        y_true, y_pred, labels=CLASSES, average="macro", zero_division=0
    )
    weighted_p, weighted_r, weighted_f1, _ = precision_recall_fscore_support(
        y_true, y_pred, labels=CLASSES, average="weighted", zero_division=0
    )

    # 2. Per-Class Metrics
    per_class_p, per_class_r, per_class_f1, per_class_supp = precision_recall_fscore_support(
        y_true, y_pred, labels=CLASSES, average=None, zero_division=0
    )

    per_class_metrics = {}
    for i, cls in enumerate(CLASSES):
        per_class_metrics[cls] = {
            "precision": round(float(per_class_p[i]), 4),
            "recall": round(float(per_class_r[i]), 4),
            "f1_score": round(float(per_class_f1[i]), 4),
            "support": int(per_class_supp[i])
        }

    # 3. Confusion Matrix
    cm = confusion_matrix(y_true, y_pred, labels=CLASSES).tolist()

    # 4. Per-Language Breakdown
    per_language = {}
    if languages is not None:
        df_eval = pd.DataFrame({"true": y_true, "pred": y_pred, "lang": languages})
        for lang, grp in df_eval.groupby("lang"):
            l_true = grp["true"].tolist()
            l_pred = grp["pred"].tolist()
            l_acc = float(accuracy_score(l_true, l_pred))
            _, _, l_f1, _ = precision_recall_fscore_support(
                l_true, l_pred, labels=CLASSES, average="macro", zero_division=0
            )
            per_language[lang] = {
                "samples": len(grp),
                "accuracy": round(l_acc, 4),
                "macro_f1": round(float(l_f1), 4)
            }

    result = {
        "accuracy": round(acc, 4),
        "macro_f1": round(float(macro_f1), 4),
        "weighted_f1": round(float(weighted_f1), 4),
        "macro_precision": round(float(macro_p), 4),
        "macro_recall": round(float(macro_r), 4),
        "weighted_precision": round(float(weighted_p), 4),
        "weighted_recall": round(float(weighted_r), 4),
        "classes": CLASSES,
        "per_class": per_class_metrics,
        "confusion_matrix": cm,
        "per_language": per_language,
        "inference_latency_ms": round(latency_ms, 2) if latency_ms is not None else None,
        "training_time_sec": round(training_time_sec, 2) if training_time_sec is not None else None
    }
    return result
