"""
Multilingual Subword Tokenizer for Indian Languages.

Handles orthographic tokenization across Devanagari, Tamil, Telugu, Malayalam,
Kannada, Bengali, Gujarati, Gurmukhi, Odia, Assamese, and Latin scripts.
Encodes text to fixed-length input_ids and attention_mask.
"""

import json
from pathlib import Path
from typing import List, Dict, Union, Optional
import unicodedata


class MultilingualTokenizer:
    PAD_TOKEN = "<pad>"
    UNK_TOKEN = "<unk>"
    CLS_TOKEN = "<cls>"
    SEP_TOKEN = "<sep>"

    def __init__(self, vocab_file: Optional[str] = None, max_vocab: int = 15000):
        self.max_vocab = max_vocab
        self.pad_id = 0
        self.unk_id = 1
        self.cls_id = 2
        self.sep_id = 3

        self.token2id: Dict[str, int] = {
            self.PAD_TOKEN: self.pad_id,
            self.UNK_TOKEN: self.unk_id,
            self.CLS_TOKEN: self.cls_id,
            self.SEP_TOKEN: self.sep_id,
        }
        self.id2token: Dict[int, str] = {v: k for k, v in self.token2id.items()}

        if vocab_file and Path(vocab_file).exists():
            self.load_vocab(vocab_file)

    def tokenize_text(self, text: str) -> List[str]:
        """Tokenize text into words, characters, and subwords."""
        text = unicodedata.normalize("NFC", str(text).strip())
        tokens = []
        words = text.split()
        for w in words:
            tokens.append(w.lower())
            # For agglutinative Indic words, also include character grams
            if len(w) > 4:
                for i in range(len(w) - 2):
                    tokens.append(w[i:i+3])
        return tokens

    def build_vocab(self, texts: List[str]):
        """Build vocabulary from training corpus."""
        token_freq: Dict[str, int] = {}
        for text in texts:
            for t in self.tokenize_text(text):
                token_freq[t] = token_freq.get(t, 0) + 1

        sorted_tokens = sorted(token_freq.items(), key=lambda x: x[1], reverse=True)
        current_id = 4
        for token, _ in sorted_tokens:
            if current_id >= self.max_vocab:
                break
            if token not in self.token2id:
                self.token2id[token] = current_id
                self.id2token[current_id] = token
                current_id += 1

    def encode(
        self,
        text: str,
        max_length: int = 128,
        padding: bool = True,
        truncation: bool = True
    ) -> Dict[str, List[int]]:
        """Convert raw text to input_ids and attention_mask."""
        tokens = self.tokenize_text(text)
        if truncation:
            tokens = tokens[: max_length - 2]

        input_ids = [self.cls_id]
        for t in tokens:
            input_ids.append(self.token2id.get(t, self.unk_id))
        input_ids.append(self.sep_id)

        seq_len = len(input_ids)
        attention_mask = [1] * seq_len

        if padding and seq_len < max_length:
            pad_len = max_length - seq_len
            input_ids.extend([self.pad_id] * pad_len)
            attention_mask.extend([0] * pad_len)

        return {
            "input_ids": input_ids,
            "attention_mask": attention_mask
        }

    def save_vocab(self, filepath: str):
        Path(filepath).parent.mkdir(parents=True, exist_ok=True)
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(self.token2id, f, ensure_ascii=False, indent=2)

    def load_vocab(self, filepath: str):
        with open(filepath, "r", encoding="utf-8") as f:
            self.token2id = json.load(f)
            self.id2token = {v: k for k, v in self.token2id.items()}
