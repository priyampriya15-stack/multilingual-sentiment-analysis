"""
Multilingual Transformer Sequence Classification Architecture.

Features:
- SentencePiece / Subword Tokenizer integration
- Transformer Encoder with Multi-Head Self-Attention
- Positional Encoding
- Dropout regularization
- Sequence classification head for 3 sentiment classes {Positive, Negative, Neutral}
- Temperature-scaled softmax confidence calibration
"""

import math
import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import List, Dict, Any, Tuple


class PositionalEncoding(nn.Module):
    def __init__(self, d_model: int, max_len: int = 512, dropout: float = 0.1):
        super().__init__()
        self.dropout = nn.Dropout(p=dropout)

        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model))
        
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        pe = pe.unsqueeze(0)
        self.register_buffer("pe", pe)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: [batch_size, seq_len, d_model]
        x = x + self.pe[:, :x.size(1)]
        return self.dropout(x)


class MultilingualTransformerClassifier(nn.Module):
    def __init__(
        self,
        vocab_size: int = 15000,
        d_model: int = 256,
        nhead: int = 8,
        num_encoder_layers: int = 3,
        dim_feedforward: int = 512,
        num_classes: int = 3,
        max_seq_len: int = 128,
        dropout: float = 0.2
    ):
        super().__init__()
        self.vocab_size = vocab_size
        self.d_model = d_model
        self.embedding = nn.Embedding(vocab_size, d_model, padding_idx=0)
        self.pos_encoder = PositionalEncoding(d_model, max_len=max_seq_len, dropout=dropout)
        
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=nhead,
            dim_feedforward=dim_feedforward,
            dropout=dropout,
            batch_first=True
        )
        self.transformer_encoder = nn.TransformerEncoder(encoder_layer, num_layers=num_encoder_layers)
        
        self.classifier = nn.Sequential(
            nn.Linear(d_model, 128),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(128, num_classes)
        )

    def forward(self, input_ids: torch.Tensor, attention_mask: torch.Tensor = None) -> torch.Tensor:
        # input_ids: [batch_size, seq_len]
        # Pad mask for transformer encoder (True indicates padded elements to ignore)
        src_key_padding_mask = (input_ids == 0) if attention_mask is None else (attention_mask == 0)
        
        x = self.embedding(input_ids) * math.sqrt(self.d_model)
        x = self.pos_encoder(x)
        
        out = self.transformer_encoder(x, src_key_padding_mask=src_key_padding_mask)
        
        # Mean pooling over non-padded tokens
        mask = (~src_key_padding_mask).unsqueeze(-1).float()
        pooled = (out * mask).sum(dim=1) / torch.clamp(mask.sum(dim=1), min=1e-9)
        
        logits = self.classifier(pooled)
        return logits
