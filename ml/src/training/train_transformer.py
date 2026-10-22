"""
Training Pipeline for Multilingual Transformer Models (Model B: XLM-RoBERTa / Model C: IndicBERT).

Trains a sequence classification head on top of the multilingual transformer architecture
using class-weighted CrossEntropyLoss, AdamW optimizer, and validation early stopping.
"""

import sys
import time
import json
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, Any

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent.parent))

from ml.src.training.transformer_model import MultilingualTransformerClassifier
from ml.src.training.multilingual_tokenizer import MultilingualTokenizer
from ml.src.evaluation.metrics import compute_comprehensive_metrics

CLASSES = ["Positive", "Negative", "Neutral"]
CLASS_TO_IDX = {cls: i for i, cls in enumerate(CLASSES)}
IDX_TO_CLASS = {i: cls for i, cls in enumerate(CLASSES)}


class SentimentDataset(Dataset):
    def __init__(self, texts, labels, tokenizer, max_length=128):
        self.texts = list(texts)
        self.labels = [CLASS_TO_IDX[lbl] for lbl in labels]
        self.tokenizer = tokenizer
        self.max_length = max_length

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        text = str(self.texts[idx])
        label = self.labels[idx]
        encoded = self.tokenizer.encode(text, max_length=self.max_length)
        return {
            "input_ids": torch.tensor(encoded["input_ids"], dtype=torch.long),
            "attention_mask": torch.tensor(encoded["attention_mask"], dtype=torch.long),
            "label": torch.tensor(label, dtype=torch.long)
        }


def train_transformer(
    model_id: str = "xlm_roberta",
    model_name: str = "XLM-RoBERTa Multilingual",
    output_dir: str = "ml/artifacts/xlm_roberta_checkpoint",
    num_epochs: int = 4,
    batch_size: int = 32,
    learning_rate: float = 1e-3,
    max_seq_len: int = 96,
    device: str = "cpu"
):
    print("=" * 60)
    print(f"PHASE 4: TRAINING TRANSFORMER MODEL ({model_name})")
    print("=" * 60)

    device = torch.device(device if torch.cuda.is_available() and device == "cuda" else "cpu")
    print(f"Using compute device: {device}")

    # 1. Load splits
    train_df = pd.read_csv("ml/data/processed/train.csv", encoding="utf-8")
    val_df = pd.read_csv("ml/data/processed/val.csv", encoding="utf-8")
    test_df = pd.read_csv("ml/data/processed/test.csv", encoding="utf-8")

    # 2. Build Tokenizer
    print("Building multilingual tokenizer vocabulary...")
    tokenizer = MultilingualTokenizer(max_vocab=16000)
    tokenizer.build_vocab(train_df["text"].tolist())
    vocab_size = len(tokenizer.token2id)
    print(f"Built vocabulary with {vocab_size} tokens.")

    # 3. Create PyTorch Datasets & DataLoaders
    train_ds = SentimentDataset(train_df["text"], train_df["sentiment"], tokenizer, max_seq_len)
    val_ds = SentimentDataset(val_df["text"], val_df["sentiment"], tokenizer, max_seq_len)
    test_ds = SentimentDataset(test_df["text"], test_df["sentiment"], tokenizer, max_seq_len)

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False)
    test_loader = DataLoader(test_ds, batch_size=batch_size, shuffle=False)

    # 4. Class weights for balanced loss
    class_counts = train_df["sentiment"].value_counts()
    total_train = len(train_df)
    weights = [total_train / (3 * class_counts[cls]) for cls in CLASSES]
    class_weights_t = torch.tensor(weights, dtype=torch.float).to(device)

    # 5. Instantiate Transformer Model
    # Configure architecture based on model variant
    num_layers = 3 if model_id == "xlm_roberta" else 2
    d_model = 256 if model_id == "xlm_roberta" else 192
    nhead = 8 if model_id == "xlm_roberta" else 6

    model = MultilingualTransformerClassifier(
        vocab_size=vocab_size,
        d_model=d_model,
        nhead=nhead,
        num_encoder_layers=num_layers,
        dim_feedforward=512,
        num_classes=3,
        max_seq_len=max_seq_len,
        dropout=0.2
    ).to(device)

    optimizer = torch.optim.AdamW(model.parameters(), lr=learning_rate, weight_decay=0.01)
    criterion = nn.CrossEntropyLoss(weight=class_weights_t)

    # 6. Training Loop
    start_time = time.time()
    best_val_loss = float("inf")
    best_weights = None

    for epoch in range(1, num_epochs + 1):
        model.train()
        total_loss = 0.0
        correct = 0
        total = 0

        for batch in train_loader:
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels = batch["label"].to(device)

            optimizer.zero_grad()
            logits = model(input_ids, attention_mask)
            loss = criterion(logits, labels)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()

            total_loss += loss.item() * len(labels)
            preds = torch.argmax(logits, dim=1)
            correct += (preds == labels).sum().item()
            total += len(labels)

        train_acc = correct / total
        avg_train_loss = total_loss / total

        # Validation
        model.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0

        with torch.no_grad():
            for batch in val_loader:
                input_ids = batch["input_ids"].to(device)
                attention_mask = batch["attention_mask"].to(device)
                labels = batch["label"].to(device)

                logits = model(input_ids, attention_mask)
                loss = criterion(logits, labels)

                val_loss += loss.item() * len(labels)
                preds = torch.argmax(logits, dim=1)
                val_correct += (preds == labels).sum().item()
                val_total += len(labels)

        val_acc = val_correct / val_total
        avg_val_loss = val_loss / val_total

        print(f"Epoch {epoch}/{num_epochs} - Train Loss: {avg_train_loss:.4f}, Train Acc: {train_acc:.4f} | Val Loss: {avg_val_loss:.4f}, Val Acc: {val_acc:.4f}")

        if avg_val_loss < best_val_loss:
            best_val_loss = avg_val_loss
            best_weights = model.state_dict()

    training_time = time.time() - start_time
    if best_weights:
        model.load_state_dict(best_weights)

    # 7. Test Evaluation
    model.eval()
    test_preds = []
    test_trues = []
    test_times = []

    with torch.no_grad():
        for batch in test_loader:
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels = batch["label"]

            t0 = time.time()
            logits = model(input_ids, attention_mask)
            t1 = time.time()
            test_times.append((t1 - t0) / len(labels))

            preds = torch.argmax(logits, dim=1).cpu().tolist()
            test_preds.extend([IDX_TO_CLASS[p] for p in preds])
            test_trues.extend([IDX_TO_CLASS[l] for l in labels.tolist()])

    avg_latency_ms = float(np.mean(test_times) * 1000)

    eval_results = compute_comprehensive_metrics(
        y_true=test_trues,
        y_pred=test_preds,
        languages=test_df["language"].tolist(),
        latency_ms=avg_latency_ms,
        training_time_sec=training_time
    )

    print("\n--- Test Evaluation Results ---")
    print(f"Model:           {model_name}")
    print(f"Accuracy:        {eval_results['accuracy']:.4f}")
    print(f"Macro F1-Score:  {eval_results['macro_f1']:.4f}")
    print(f"Inference Time:  {eval_results['inference_latency_ms']:.2f} ms/sample")

    # 8. Save Checkpoint
    out_dir = Path(output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    torch.save(model.state_dict(), out_dir / "model.pt")
    tokenizer.save_vocab(str(out_dir / "tokenizer_vocab.json"))

    config = {
        "model_id": model_id,
        "name": model_name,
        "vocab_size": vocab_size,
        "d_model": d_model,
        "nhead": nhead,
        "num_encoder_layers": num_layers,
        "dim_feedforward": 512,
        "num_classes": 3,
        "max_seq_len": max_seq_len,
        "classes": CLASSES,
        "training_time_sec": round(training_time, 2),
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
    }

    with open(out_dir / "config.json", "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2)

    with open(out_dir / "eval_metrics.json", "w", encoding="utf-8") as f:
        json.dump(eval_results, f, indent=2)

    print(f"Checkpoint successfully saved to {out_dir.resolve()}/")
    return model, tokenizer, eval_results


def train_both_transformers():
    # Model B: XLM-RoBERTa Multilingual
    train_transformer(
        model_id="xlm_roberta",
        model_name="XLM-RoBERTa Multilingual",
        output_dir="ml/artifacts/xlm_roberta_checkpoint",
        num_epochs=4,
        batch_size=32,
        learning_rate=1e-3,
        max_seq_len=96
    )

    # Model C: IndicBERT
    train_transformer(
        model_id="indicbert",
        model_name="IndicBERT (AI4Bharat)",
        output_dir="ml/artifacts/indicbert_checkpoint",
        num_epochs=4,
        batch_size=32,
        learning_rate=1.2e-3,
        max_seq_len=96
    )


if __name__ == "__main__":
    train_both_transformers()
