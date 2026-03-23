"""Localized titles/descriptions for static community topics."""
from __future__ import annotations

from app.recommendations_i18n import normalize_lang

TOPIC_I18N: dict[str, dict[str, dict[str, str]]] = {
    "health_tips": {
        "hi": {"title": "स्वास्थ्य सुझाव", "description": "स्वास्थ्य सुझाव साझा करें और पढ़ें।"},
        "ta": {"title": "உடல்நல குறிப்புகள்", "description": "உடல்நல குறிப்புகளைப் பகிர்ந்து படியுங்கள்."},
    },
    "daily_life": {
        "hi": {"title": "दैनिक जीवन", "description": "रोज़मर्रा के अनुभव और सहारा।"},
        "ta": {"title": "தினசரி வாழ்க்கை", "description": "நாள்தோறும் அனுபவங்களும் ஆதரவும்."},
    },
    "mental_wellbeing": {
        "hi": {"title": "मानसिक कल्याण", "description": "मानसिक स्वास्थ्य और मूड सहारा।"},
        "ta": {"title": "மன நலம்", "description": "மன ஆரோக்கியமும் மனநிலை ஆதரவும்."},
    },
    "hobbies": {
        "hi": {"title": "शौक", "description": "शौक और गतिविधियाँ।"},
        "ta": {"title": "பொழுதுபோக்குகள்", "description": "பொழுதுபோக்குகளும் செயல்பாடுகளும்."},
    },
}


def localize_topic(topic: dict, lang: str | None) -> dict:
    n = normalize_lang(lang)
    if n == "en":
        return dict(topic)
    tid = topic.get("id", "")
    pack = TOPIC_I18N.get(tid, {}).get(n)
    if not pack:
        return dict(topic)
    out = dict(topic)
    out["title"] = pack["title"]
    out["description"] = pack["description"]
    return out
