"""
Language Identification Module for Indian Languages and Code-Mixed Text.

Uses deterministic Unicode block analysis for native Indic scripts:
- Devanagari: Hindi, Marathi
- Tamil: Tamil
- Telugu: Telugu
- Kannada: Kannada
- Malayalam: Malayalam
- Bengali-Assamese: Bengali, Assamese
- Gujarati: Gujarati
- Gurmukhi: Punjabi
- Odia: Odia

Includes heuristics for distinguishing Devanagari languages (Hindi vs Marathi),
Bengali vs Assamese, and identifying Latin-script code-mixing (Hinglish, Tanglish).
Falls back to langdetect for ambiguous cases.
"""

import re
import unicodedata
from typing import Dict, Any, Tuple

# Unicode range blocks for Indic scripts
INDIC_UNICODE_RANGES = {
    "Devanagari": (0x0900, 0x097F),
    "Bengali": (0x0980, 0x09FF),
    "Gurmukhi": (0x0A00, 0x0A7F),
    "Gujarati": (0x0A80, 0x0AFF),
    "Odia": (0x0B00, 0x0B7F),
    "Tamil": (0x0B80, 0x0BFF),
    "Telugu": (0x0C00, 0x0C7F),
    "Kannada": (0x0C80, 0x0CFF),
    "Malayalam": (0x0D00, 0x0D7F),
}

# Assamese unique characters in Bengali script block: ৰ (U+09F0), ৱ (U+09F1)
ASSAMESE_UNIQUE_CHARS = {"\u09F0", "\u09F1"}

# Marathi distinctive Devanagari characters and markers (e.g. ळ U+0933)
MARATHI_DISTINCTIVE_CHARS = {"\u0933"}
MARATHI_MARKERS = {
    "आहे", "नाही", "फार", "खूप", "सुंदर", "झाला", "झाली", "झाले",
    "कसा", "कशी", "केले", "म्हणून", "पण", "आणि", "कदाचित"
}

# Hindi markers in Devanagari
HINDI_MARKERS = {
    "है", "हैं", "नहीं", "बहुत", "अच्छा", "बुरा", "था", "थी", "थे",
    "और", "लेकिन", "कि", "यह", "वह", "किया", "गया", "होगा"
}

# Code-mixed Romanized Hinglish vocabulary triggers
HINGLISH_TRIGGERS = {
    "hai", "hain", "nahi", "nahin", "bohot", "bahut", "achha", "achhi",
    "bura", "bakwaas", "mast", "ekdum", "yaar", "bhai", "karo", "karega",
    "kar", "ho", "raha", "rahi", "tha", "thi", "the", "kya", "kyun",
    "lekin", "aur", "toh", "ye", "yeh", "wo", "woh", "sahi", "galat"
}

# Code-mixed Romanized Tanglish vocabulary triggers
TANGLISH_TRIGGERS = {
    "semma", "mass", "vera", "level", "romba", "nalla", "illai", "illa",
    "padam", "irukku", "irukanga", "pannunga", "pa", "da", "machan",
    "theriyum", "supera", "nallave", "paravala", "marana"
}


def get_script_distribution(text: str) -> Dict[str, int]:
    """Calculate character counts belonging to different Unicode scripts."""
    distribution: Dict[str, int] = {}
    latin_count = 0
    total_letters = 0

    for ch in text:
        cp = ord(ch)
        if unicodedata.category(ch).startswith("L"):
            total_letters += 1
            if ("a" <= ch <= "z") or ("A" <= ch <= "Z"):
                latin_count += 1
            matched = False
            for script_name, (start, end) in INDIC_UNICODE_RANGES.items():
                if start <= cp <= end:
                    distribution[script_name] = distribution.get(script_name, 0) + 1
                    matched = True
                    break

    if latin_count > 0:
        distribution["Latin"] = latin_count

    return distribution, total_letters


def detect_language(text: str, fallback_to_langdetect: bool = True) -> Dict[str, Any]:
    """
    Detect the primary language of the input text.
    
    Returns a dictionary containing:
    - language_code: ISO 639-1 code (e.g., 'hi', 'ta', 'en', 'hi-en')
    - language_name: Human readable name
    - script: Writing script name
    - confidence: Confidence float [0.0, 1.0]
    - is_uncertain: Boolean warning if detection confidence is borderline
    - is_code_mixed: Boolean indicating Hinglish/Tanglish
    """
    if not text or not text.strip():
        return {
            "language_code": "unknown",
            "language_name": "Unknown",
            "script": "None",
            "confidence": 0.0,
            "is_uncertain": True,
            "is_code_mixed": False,
        }

    clean_text = unicodedata.normalize("NFC", text.strip())
    dist, total_letters = get_script_distribution(clean_text)

    if total_letters == 0:
        return {
            "language_code": "unknown",
            "language_name": "Unknown (No alphabetic characters)",
            "script": "Punctuation/Numeric",
            "confidence": 0.0,
            "is_uncertain": True,
            "is_code_mixed": False,
        }

    # Identify dominant script
    dominant_script, max_count = max(dist.items(), key=lambda x: x[1])
    script_ratio = max_count / total_letters

    # Native Indic Script mappings
    if dominant_script == "Tamil":
        return {
            "language_code": "ta",
            "language_name": "Tamil",
            "script": "Tamil",
            "confidence": round(min(0.99, max(0.70, script_ratio)), 3),
            "is_uncertain": script_ratio < 0.60,
            "is_code_mixed": False,
        }

    elif dominant_script == "Telugu":
        return {
            "language_code": "te",
            "language_name": "Telugu",
            "script": "Telugu",
            "confidence": round(min(0.99, max(0.70, script_ratio)), 3),
            "is_uncertain": script_ratio < 0.60,
            "is_code_mixed": False,
        }

    elif dominant_script == "Malayalam":
        return {
            "language_code": "ml",
            "language_name": "Malayalam",
            "script": "Malayalam",
            "confidence": round(min(0.99, max(0.70, script_ratio)), 3),
            "is_uncertain": script_ratio < 0.60,
            "is_code_mixed": False,
        }

    elif dominant_script == "Kannada":
        return {
            "language_code": "kn",
            "language_name": "Kannada",
            "script": "Kannada",
            "confidence": round(min(0.99, max(0.70, script_ratio)), 3),
            "is_uncertain": script_ratio < 0.60,
            "is_code_mixed": False,
        }

    elif dominant_script == "Gujarati":
        return {
            "language_code": "gu",
            "language_name": "Gujarati",
            "script": "Gujarati",
            "confidence": round(min(0.99, max(0.70, script_ratio)), 3),
            "is_uncertain": script_ratio < 0.60,
            "is_code_mixed": False,
        }

    elif dominant_script == "Gurmukhi":
        return {
            "language_code": "pa",
            "language_name": "Punjabi",
            "script": "Gurmukhi",
            "confidence": round(min(0.99, max(0.70, script_ratio)), 3),
            "is_uncertain": script_ratio < 0.60,
            "is_code_mixed": False,
        }

    elif dominant_script == "Odia":
        return {
            "language_code": "or",
            "language_name": "Odia",
            "script": "Odia",
            "confidence": round(min(0.99, max(0.70, script_ratio)), 3),
            "is_uncertain": script_ratio < 0.60,
            "is_code_mixed": False,
        }

    elif dominant_script == "Bengali":
        # Check if Assamese characters are present
        has_assamese_char = any(c in clean_text for c in ASSAMESE_UNIQUE_CHARS)
        if has_assamese_char:
            return {
                "language_code": "as",
                "language_name": "Assamese",
                "script": "Bengali-Assamese",
                "confidence": round(min(0.98, max(0.75, script_ratio)), 3),
                "is_uncertain": False,
                "is_code_mixed": False,
            }
        # Check Assamese lexicon markers vs Bengali
        words = set(re.findall(r"\w+", clean_text.lower()))
        assamese_words = {"নহয়", "আছে", "বহুত", "ভাল", "কেনে", "কৰা"}
        if len(words & assamese_words) > 0 and len(words & {"নয়", "আছেন", "খুব"}) == 0:
            return {
                "language_code": "as",
                "language_name": "Assamese",
                "script": "Bengali-Assamese",
                "confidence": 0.85,
                "is_uncertain": False,
                "is_code_mixed": False,
            }
        return {
            "language_code": "bn",
            "language_name": "Bengali",
            "script": "Bengali",
            "confidence": round(min(0.99, max(0.70, script_ratio)), 3),
            "is_uncertain": script_ratio < 0.60,
            "is_code_mixed": False,
        }

    elif dominant_script == "Devanagari":
        # Distinguish between Hindi and Marathi
        has_marathi_char = any(c in clean_text for c in MARATHI_DISTINCTIVE_CHARS)
        words = set(re.findall(r"\w+", clean_text))
        marathi_hits = len(words & MARATHI_MARKERS)
        hindi_hits = len(words & HINDI_MARKERS)

        if has_marathi_char or (marathi_hits > hindi_hits):
            return {
                "language_code": "mr",
                "language_name": "Marathi",
                "script": "Devanagari",
                "confidence": round(min(0.98, max(0.75, script_ratio)), 3),
                "is_uncertain": script_ratio < 0.60,
                "is_code_mixed": False,
            }
        else:
            return {
                "language_code": "hi",
                "language_name": "Hindi",
                "script": "Devanagari",
                "confidence": round(min(0.99, max(0.75, script_ratio)), 3),
                "is_uncertain": script_ratio < 0.60,
                "is_code_mixed": False,
            }

    elif dominant_script == "Latin":
        # Check for Code-mixed Hindi (Hinglish) or Tamil (Tanglish)
        tokens = [t.lower() for t in re.findall(r"[a-zA-Z]+", clean_text)]
        token_set = set(tokens)

        hinglish_count = len(token_set & HINGLISH_TRIGGERS)
        tanglish_count = len(token_set & TANGLISH_TRIGGERS)

        if hinglish_count >= 2 or (hinglish_count >= 1 and len(tokens) <= 5):
            return {
                "language_code": "hi-en",
                "language_name": "Hinglish (Code-Mixed)",
                "script": "Latin",
                "confidence": round(min(0.92, 0.65 + 0.08 * hinglish_count), 3),
                "is_uncertain": False,
                "is_code_mixed": True,
            }
        elif tanglish_count >= 2 or (tanglish_count >= 1 and len(tokens) <= 5):
            return {
                "language_code": "ta-en",
                "language_name": "Tanglish (Code-Mixed)",
                "script": "Latin",
                "confidence": round(min(0.90, 0.65 + 0.08 * tanglish_count), 3),
                "is_uncertain": False,
                "is_code_mixed": True,
            }

        # Check standard English using langdetect fallback
        if fallback_to_langdetect:
            try:
                from langdetect import detect, detect_langs
                langs = detect_langs(clean_text)
                top = langs[0]
                if top.lang == "en":
                    return {
                        "language_code": "en",
                        "language_name": "English",
                        "script": "Latin",
                        "confidence": round(top.prob, 3),
                        "is_uncertain": top.prob < 0.70,
                        "is_code_mixed": False,
                    }
            except Exception:
                pass

        return {
            "language_code": "en",
            "language_name": "English",
            "script": "Latin",
            "confidence": 0.85,
            "is_uncertain": False,
            "is_code_mixed": False,
        }

    return {
        "language_code": "unknown",
        "language_name": "Unknown",
        "script": dominant_script,
        "confidence": 0.40,
        "is_uncertain": True,
        "is_code_mixed": False,
    }
