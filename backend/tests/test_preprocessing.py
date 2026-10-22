"""
Automated Unit Tests for Text Preprocessing and Label Normalization.
"""

import pytest
from ml.src.preprocessing.cleaner import clean_text, normalize_sentiment_label, normalize_unicode


def test_unicode_normalization():
    # Composed vs decomposed Devanagari characters
    text = "हिन्दी"
    norm = normalize_unicode(text)
    assert isinstance(norm, str)
    assert len(norm) > 0


def test_clean_text_removes_urls_and_html():
    raw = "Check this product http://example.com/item and <div class='test'>Awesome!</div>"
    cleaned = clean_text(raw)
    assert "http" not in cleaned
    assert "example.com" not in cleaned
    assert "<div>" not in cleaned
    assert "<div class='test'>" not in cleaned
    assert "Awesome!" in cleaned


def test_clean_text_preserves_emojis():
    raw = "Movie was great! 😀 ❤️ 👍"
    cleaned = clean_text(raw)
    assert "😀" in cleaned
    assert "👍" in cleaned


def test_clean_text_handles_empty_and_none():
    assert clean_text("") == ""
    assert clean_text(None) == ""
    assert clean_text("   ") == ""


def test_clean_text_max_length_truncation():
    long_text = "word " * 1000
    cleaned = clean_text(long_text, max_length=100)
    assert len(cleaned) <= 100


def test_normalize_sentiment_label():
    assert normalize_sentiment_label("positive") == "Positive"
    assert normalize_sentiment_label("Pos") == "Positive"
    assert normalize_sentiment_label("1") == "Positive"
    assert normalize_sentiment_label("negative") == "Negative"
    assert normalize_sentiment_label("-1") == "Negative"
    assert normalize_sentiment_label("neutral") == "Neutral"
    assert normalize_sentiment_label("0") == "Neutral"
    assert normalize_sentiment_label("unrecognized_label") is None
    assert normalize_sentiment_label(None) is None
