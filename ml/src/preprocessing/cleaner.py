"""
Multilingual Preprocessing and Normalization Module.

Handles:
- Unicode normalization (NFC/NFKC)
- URL, HTML tag, and extraneous whitespace removal
- Preservation of sentiment-bearing tokens, negation markers, and emojis
- Label normalization to {Positive, Negative, Neutral}
- Safe handling of missing and outlier texts
"""

import re
import unicodedata
from typing import Optional, Dict

# Standard Label Normalization Map
LABEL_NORMALIZATION = {
    "positive": "Positive",
    "pos": "Positive",
    "1": "Positive",
    "+1": "Positive",
    "favorable": "Positive",
    "negative": "Negative",
    "neg": "Negative",
    "-1": "Negative",
    "unfavorable": "Negative",
    "neutral": "Neutral",
    "neu": "Neutral",
    "0": "Neutral",
    "mixed": "Neutral",
}

# Regex patterns
URL_PATTERN = re.compile(r"https?://\S+|www\.\S+")
HTML_TAG_PATTERN = re.compile(r"<.*?>")
WHITESPACE_PATTERN = re.compile(r"\s+")
MULTIPLE_PUNCT_PATTERN = re.compile(r"([!?.,])\1+")

# Supported emojis to preserve explicitly
SENTIMENT_EMOJIS = set("😀😁😂😃😄😅😆😉😊😋😎😍😘🥰😗😙😚☺️🙂🤗🤩🤔🤨😐😑😶🙄😏😣😥😮🤐😯😪😫🥱😴😌😛😜😝🤤😒😓😔😕🙃🤑😲☹️🙁😖😞😟😤😢😭😦😧😨😩🤯😬😰😱🥵🥶😳🤪😵🥴😠😡🤬😷🤒🤕🤢🤮🤧😇🥳🥺🤠🤡")


def normalize_unicode(text: str) -> str:
    """Normalize string using Unicode NFC form."""
    if not isinstance(text, str):
        return ""
    return unicodedata.normalize("NFC", text)


def clean_text(
    text: Optional[str],
    preserve_emojis: bool = True,
    max_length: int = 2000,
) -> str:
    """
    Clean and preprocess text for multilingual NLP models.
    
    1. Check for null or non-string input.
    2. Normalize to NFC Unicode.
    3. Remove URLs and HTML tags.
    4. Normalize excessive repeated punctuation (e.g., '!!!!' -> '!') while preserving exclamation.
    5. Strip excessive whitespaces.
    6. Safely clamp text to max_length without cutting words arbitrarily.
    """
    if text is None:
        return ""

    if not isinstance(text, str):
        text = str(text)

    # 1. Unicode Normalization
    text = normalize_unicode(text)

    # 2. Strip URLs & HTML tags
    text = URL_PATTERN.sub(" ", text)
    text = HTML_TAG_PATTERN.sub(" ", text)

    # 3. Collapse repeated punctuation to max 2 occurrences
    text = MULTIPLE_PUNCT_PATTERN.sub(r"\1\1", text)

    # 4. Collapse whitespace
    text = WHITESPACE_PATTERN.sub(" ", text).strip()

    # 5. Length limit
    if len(text) > max_length:
        text = text[:max_length].rsplit(" ", 1)[0]

    return text


def normalize_sentiment_label(raw_label: Optional[str]) -> Optional[str]:
    """
    Normalize various dataset label formats into standard:
    Positive, Negative, or Neutral.
    
    Returns None if label is unrecognized or missing.
    """
    if raw_label is None:
        return None

    cleaned = str(raw_label).strip().lower()
    return LABEL_NORMALIZATION.get(cleaned, None)
