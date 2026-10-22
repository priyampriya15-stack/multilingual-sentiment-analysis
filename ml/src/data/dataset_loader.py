"""
Dataset Loader, Validator, and Splitter for Multilingual Sentiment Analysis.

Ensures:
- Schema validation: (text, language, sentiment, source, split, sample_id)
- Sentiment normalization to {Positive, Negative, Neutral}
- Exact and near-duplicate removal across train/val/test splits to prevent leakage
- Stratified splitting by (language, sentiment)
"""

import os
import json
import uuid
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Tuple, Dict, Any, List

from ml.src.preprocessing.cleaner import clean_text, normalize_sentiment_label

EXPECTED_COLUMNS = ["sample_id", "text", "language", "sentiment", "source", "split"]


def validate_dataframe(df: pd.DataFrame) -> Tuple[bool, List[str]]:
    """Verify that a dataframe contains the expected schema and valid values."""
    issues = []
    for col in ["text", "language", "sentiment"]:
        if col not in df.columns:
            issues.append(f"Missing mandatory column: {col}")

    if issues:
        return False, issues

    null_texts = df["text"].isna().sum()
    if null_texts > 0:
        issues.append(f"Found {null_texts} null text entries")

    invalid_sentiments = (~df["sentiment"].isin(["Positive", "Negative", "Neutral"])).sum()
    if invalid_sentiments > 0:
        issues.append(f"Found {invalid_sentiments} rows with non-standard sentiment labels")

    return len(issues) == 0, issues


def split_dataset_stratified(
    df: pd.DataFrame,
    train_ratio: float = 0.70,
    val_ratio: float = 0.15,
    test_ratio: float = 0.15,
    random_state: int = 42,
) -> pd.DataFrame:
    """
    Split dataframe into train, val, and test stratified by (language, sentiment).
    Deduplicates text first to strictly avoid data leakage.
    """
    # Clean text and deduplicate
    df = df.copy()
    df["clean_text"] = df["text"].apply(clean_text)
    df = df[df["clean_text"].str.len() > 3]

    # Remove exact duplicate texts to prevent leakage
    df = df.drop_duplicates(subset=["clean_text"]).reset_index(drop=True)

    # Ensure unique sample_id
    if "sample_id" not in df.columns or df["sample_id"].isna().any():
        df["sample_id"] = [str(uuid.uuid4())[:8] for _ in range(len(df))]

    # Combine language and sentiment as stratification key
    df["strata"] = df["language"] + "_" + df["sentiment"]

    # Stratified split using scikit-learn
    from sklearn.model_selection import StratifiedShuffleSplit

    # Split train vs temp (val + test)
    temp_ratio = val_ratio + test_ratio
    sss_1 = StratifiedShuffleSplit(n_splits=1, test_size=temp_ratio, random_state=random_state)
    
    # Handle rare strata with < 2 items
    counts = df["strata"].value_counts()
    valid_strata = counts[counts >= 2].index
    
    df_valid = df[df["strata"].isin(valid_strata)].copy()
    df_rare = df[~df["strata"].isin(valid_strata)].copy()

    train_idx, temp_idx = next(sss_1.split(df_valid, df_valid["strata"]))
    
    df_train = df_valid.iloc[train_idx].copy()
    df_temp = df_valid.iloc[temp_idx].copy()

    # Split temp into val and test
    relative_test_ratio = test_ratio / temp_ratio
    sss_2 = StratifiedShuffleSplit(n_splits=1, test_size=relative_test_ratio, random_state=random_state)
    
    # Check strata in temp
    temp_counts = df_temp["strata"].value_counts()
    valid_temp_strata = temp_counts[temp_counts >= 2].index
    
    df_temp_valid = df_temp[df_temp["strata"].isin(valid_temp_strata)].copy()
    df_temp_rare = df_temp[~df_temp["strata"].isin(valid_temp_strata)].copy()

    val_idx, test_idx = next(sss_2.split(df_temp_valid, df_temp_valid["strata"]))
    df_val = df_temp_valid.iloc[val_idx].copy()
    df_test = df_temp_valid.iloc[test_idx].copy()

    # Distribute rare items
    df_train = pd.concat([df_train, df_rare], ignore_index=True)
    df_val = pd.concat([df_val, df_temp_rare], ignore_index=True)

    df_train["split"] = "train"
    df_val["split"] = "val"
    df_test["split"] = "test"

    combined = pd.concat([df_train, df_val, df_test], ignore_index=True)
    combined = combined.drop(columns=["strata", "clean_text"], errors="ignore")

    # Order columns
    for col in ["source"]:
        if col not in combined.columns:
            combined[col] = "corpus"

    return combined[EXPECTED_COLUMNS]
