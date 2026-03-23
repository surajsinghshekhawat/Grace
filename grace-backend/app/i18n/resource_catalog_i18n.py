"""
Localized display strings for the static resources catalog (hi, ta).
English uses the canonical fields on each catalog item.
"""

from __future__ import annotations

from copy import deepcopy
from typing import Any

# English category string (as in CATALOG) -> localized label
_CATEGORY_LABELS: dict[str, dict[str, str]] = {
    "hi": {
        "Calm & sleep": "शांति और नींद",
        "Mental health": "मानसिक स्वास्थ्य",
        "Movement": "हल्की गतिविधि",
        "Connection": "सामाजिक जुड़ाव",
        "Nutrition": "पोषण",
        "Learning": "सीखना और विकास",
        "Community": "समुदाय",
        "Brain health": "दिमाग़ की सेहत",
        "Daily care": "दैनिक देखभाल",
        "Urgent": "तत्काल सहायता",
    },
    "ta": {
        "Calm & sleep": "அமைதி மற்றும் தூக்கம்",
        "Mental health": "மன நலம்",
        "Movement": "இலகுவான அசைவு",
        "Connection": "சமூக இணைப்பு",
        "Nutrition": "ஊட்டச்சத்து",
        "Learning": "கற்றலும் வளர்ச்சியும்",
        "Community": "சமூகம்",
        "Brain health": "மூளை ஆரோக்கியம்",
        "Daily care": "தினசரி பராமரிப்பு",
        "Urgent": "அவசர உதவி",
    },
}

_ITEM_FIELDS: dict[str, dict[str, dict[str, str]]] = {
    "hi": {
        "mindfulness_relaxation": {
            "title": "माइंडफुलनेस और विश्राम",
            "summary": "साँस, बॉडी स्कैन और 5–15 मिनट के शांत करने वाले रूटीन।",
        },
        "mental_health_support": {
            "title": "मानसिक स्वास्थ्य और परामर्श",
            "summary": "कई हफ़्तों तक भारी मूड हो या आत्महानि के विचार आएँ, तो पेशेवर सहायता ज़रूरी हो सकती है।",
        },
        "healthy_movement": {
            "title": "हल्की गतिविधि और व्यायाम",
            "summary": "चलना, कुर्सी व्यायाम और संतुलन — अलग-अलग क्षमता के अनुरूप।",
        },
        "social_connection": {
            "title": "सामाजिक रूप से जुड़े रहना",
            "summary": "अकेलापन कम करने के लिए: कॉल, समूह, सेवा, धर्म या शौक समुदाय।",
        },
        "nutrition_wellbeing": {
            "title": "बुज़ुर्गों के लिए स्वस्थ खाना",
            "summary": "संतुलित थाली, पानी, और भूख में बदलाव पर चिकित्सक से बात।",
        },
        "learning_growth": {
            "title": "सीखना और स्वस्थ बुढ़ापा",
            "summary": "नींद, मूड, सोच और रुचि बनाए रखने पर लेख और पाठ्यक्रम।",
        },
        "community_fun": {
            "title": "Grace के अंदर समुदाय",
            "summary": "जीत साझा करें, सवाल पूछें और दूसरों का हौसला बढ़ाएँ — समुदाय टैब में।",
        },
        "sleep_wellbeing": {
            "title": "नींद की दिनचर्या",
            "summary": "नियमित उठने का समय, रात में कम स्क्रीन, और सरल सोने से पहले की दिनचर्या।",
        },
        "cognitive_health": {
            "title": "याददाश्त और सोच",
            "summary": "डॉक्टर से कब बात करें, मानसिक रूप से सक्रिय रहना, और ध्यान भटाव कम करना।",
        },
        "health_routines": {
            "title": "दवाइयाँ और दिनचर्या",
            "summary": "गोली बॉक्स, अलार्म और फार्मासिस्ट समीक्षा से दवा समय पर लेना आसान हो सकता है।",
        },
        "crisis_help": {
            "title": "संकट और आपातकाल",
            "summary": "तत्काल खतरे में हों तो स्थानीय आपातकालीन नंबर पर कॉल करें।",
        },
    },
    "ta": {
        "mindfulness_relaxation": {
            "title": "மனக்கவனம் மற்றும் ஓய்வு",
            "summary": "சுவாசம், உடல் ஸ்கேன், 5–15 நிமிட ஓய்வு வழக்கங்கள்.",
        },
        "mental_health_support": {
            "title": "மன நலம் மற்றும் ஆலோசனை",
            "summary": "வாரங்களாக மனச்சோர்வு அல்லது தற்கொலை எண்ணங்கள் இருந்தால் தொழில்முறை ஆதரவு முக்கியம்.",
        },
        "healthy_movement": {
            "title": "இலகுவான அசைவும் உடற்பயிற்சியும்",
            "summary": "நடை, நாற்காலி பயிற்சிகள், சமநிலை — திறனுக்கேற்ப.",
        },
        "social_connection": {
            "title": "சமூகத்துடன் இணைந்திருத்தல்",
            "summary": "தனிமை குறைய: அழைப்புகள், குழுக்கள், தன்னார்வம், நம்பிக்கை அல்லது பொழுதுபோக்கு சமூகங்கள்.",
        },
        "nutrition_wellbeing": {
            "title": "மூத்தவர்களுக்கு ஆரோக்கிய உணவு",
            "summary": "சமச்சீர் தட்டு, நீரேற்றம், பசி மாற்றங்களை மருத்துவரிடம் கூறுதல்.",
        },
        "learning_growth": {
            "title": "கற்றலும் ஆரோக்கிய முதுமையும்",
            "summary": "தூக்கம், மனநிலை, அறிவு, ஈடுபாடு குறித்த கட்டுரைகள் மற்றும் பாடங்கள்.",
        },
        "community_fun": {
            "title": "Grace-இல் சமூகம்",
            "summary": "வெற்றிகளைப் பகிரவும், கேள்விகள் கேட்கவும், மற்றவர்களை ஊக்குவிக்கவும் — சமூக தாவலில்.",
        },
        "sleep_wellbeing": {
            "title": "தூக்க பழக்கவழக்கம்",
            "summary": "ஒழுங்கான எழுந்திருப்பு, இரவில் குறைந்த திரை, எளிய உறங்கும் முன் வழக்கம்.",
        },
        "cognitive_health": {
            "title": "நினைவும் சிந்தனையும்",
            "summary": "மருத்துவரிடம் எப்போது பேசுவது, மனச்சுறுசுறுப்பு, கவனச்சிதறல் குறைத்தல்.",
        },
        "health_routines": {
            "title": "மருந்துகளும் நாள்கிருமையும்",
            "summary": "மாத்திரை பெட்டி, அலாரம், மருந்தகர் ஆய்வு — ஒழுங்காக எடுக்க உதவும்.",
        },
        "crisis_help": {
            "title": "நெருக்கடியும் அவசரமும்",
            "summary": "உடனடி ஆபத்தில் உள்ளூர் அவசர எண்ணை அழைக்கவும்.",
        },
    },
}


def normalize_lang(lang: str | None) -> str:
    if not lang:
        return "en"
    code = lang.strip().lower()[:2]
    return code if code in ("en", "hi", "ta") else "en"


def localize_resource_item(item: dict[str, Any], lang: str) -> dict[str, Any]:
    """Return a deep copy with title/summary/category localized when lang is hi or ta."""
    lang = normalize_lang(lang)
    out = deepcopy(item)
    if lang == "en":
        return out

    cat_en = item.get("category") or ""
    if cat_en in _CATEGORY_LABELS.get(lang, {}):
        out["category"] = _CATEGORY_LABELS[lang][cat_en]

    rid = item.get("id")
    if rid and rid in _ITEM_FIELDS.get(lang, {}):
        patch = _ITEM_FIELDS[lang][rid]
        if "title" in patch:
            out["title"] = patch["title"]
        if "summary" in patch:
            out["summary"] = patch["summary"]

    out["lang"] = lang
    return out


def localized_categories_for_lang(lang: str) -> list[str]:
    """Sorted unique category labels as shown for this language."""
    from app.routers.resources_catalog import CATALOG

    lang = normalize_lang(lang)
    seen: set[str] = set()
    ordered: list[str] = []
    for item in CATALOG:
        loc = localize_resource_item(item, lang)
        c = loc.get("category") or ""
        if c not in seen:
            seen.add(c)
            ordered.append(c)
    return sorted(ordered)
