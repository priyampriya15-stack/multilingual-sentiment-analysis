"""
Automated Unit Tests for Script and Language Detection.
"""

import pytest
from ml.src.language_detection.detector import detect_language


def test_detect_hindi():
    text = "यह सेवा वास्तव में अद्भुत और बहुत ही उपयोगी है"
    res = detect_language(text)
    assert res["language_code"] == "hi"
    assert res["script"] == "Devanagari"
    assert res["confidence"] >= 0.70


def test_detect_tamil():
    text = "இந்த திரைப்படம் மிகவும் அருமையாக உள்ளது"
    res = detect_language(text)
    assert res["language_code"] == "ta"
    assert res["script"] == "Tamil"
    assert res["confidence"] >= 0.70


def test_detect_telugu():
    text = "ఈ పుస్తకం చాలా అద్భుతంగా ఉంది"
    res = detect_language(text)
    assert res["language_code"] == "te"
    assert res["script"] == "Telugu"


def test_detect_malayalam():
    text = "ഈ ഹോട്ടലിലെ ഭക്ഷണം വളരെ രുചികരവും ശുചിത്വമുള്ളതുമാണ്"
    res = detect_language(text)
    assert res["language_code"] == "ml"
    assert res["script"] == "Malayalam"


def test_detect_kannada():
    text = "ಈ ಮೊಬೈಲ್ ಫೋನ್ ಕ್ಯಾಮೆರಾ ಅತ್ಯುತ್ತಮವಾಗಿದೆ"
    res = detect_language(text)
    assert res["language_code"] == "kn"
    assert res["script"] == "Kannada"


def test_detect_bengali():
    text = "এই নাটকটি সত্যিই অসাধারণ এবং হৃদয়স্পর্শী হয়েছে"
    res = detect_language(text)
    assert res["language_code"] == "bn"
    assert res["script"] == "Bengali"


def test_detect_gujarati():
    text = "આ પુસ્તક ખૂબ જ પ્રેરણાદાયક અને માહિતીપ્રદ છે"
    res = detect_language(text)
    assert res["language_code"] == "gu"
    assert res["script"] == "Gujarati"


def test_detect_punjabi():
    text = "ਇਹ ਗੀਤ ਸੁਣ ਕੇ ਮਨ ਖੁਸ਼ ਹੋ ਗਿਆ"
    res = detect_language(text)
    assert res["language_code"] == "pa"
    assert res["script"] == "Gurmukhi"


def test_detect_odia():
    text = "ଏହି ଚଳଚ୍ଚିତ୍ରଟି ବହୁତ ସୁନ୍ଦର ଏବଂ ଶିକ୍ଷଣୀୟ"
    res = detect_language(text)
    assert res["language_code"] == "or"
    assert res["script"] == "Odia"


def test_detect_hinglish():
    text = "Movie sach mein bohot mast thi yaar acting ekdum super hai"
    res = detect_language(text)
    assert res["language_code"] == "hi-en"
    assert res["is_code_mixed"] is True


def test_detect_english():
    text = "This is a great product with exceptional quality and fast delivery."
    res = detect_language(text)
    assert res["language_code"] == "en"
    assert res["is_code_mixed"] is False


def test_empty_or_punctuation_only():
    res1 = detect_language("")
    assert res1["language_code"] == "unknown"
    assert res1["is_uncertain"] is True

    res2 = detect_language("12345 !@#$%")
    assert res2["language_code"] == "unknown"
    assert res2["is_uncertain"] is True
