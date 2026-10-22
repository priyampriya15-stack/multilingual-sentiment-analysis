"""
Language Detection Service.
"""

from typing import Dict, Any, Optional
from ml.src.language_detection.detector import detect_language


class LanguageService:
    @staticmethod
    def identify(text: str, override: Optional[str] = None) -> Dict[str, Any]:
        """Identify language with optional manual user override."""
        result = detect_language(text)
        if override:
            result["language_code"] = override
            result["is_uncertain"] = False
        return result
