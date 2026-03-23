"""
Derive a self-reported wellbeing score (0–100) from Grace questionnaire answers
so we can blend with the ML QoL output when the regression target scale is ambiguous.
"""
from __future__ import annotations

from typing import Any

# Question IDs that are typically 1–5 (Likert / smiley) and indicate wellbeing when high
WELLBEING_LIKERT_KEYS = frozenset(
    {
        "sleep_quality",
        "stress_anxiety",  # high = more stress — inverted below
        "family_interaction",
        "friends_interaction",
        "respect",
        "community_activities",
        "lonely_around_others",  # high = more lonely — inverted
        "social_satisfaction",
        "doctor_visit",
        "health_checkups",
        "medication",
        "healthcare_access",
        "joy",
        "control",
        "confidence",
    }
)

# Smiley / QoL-style keys (higher = better)
QOL_STYLE_PREFIXES = ("qol_",)


def _as_score_1_5(val: Any) -> float | None:
    if val is None:
        return None
    try:
        v = float(val)
    except (TypeError, ValueError):
        return None
    if 1 <= v <= 5:
        return v
    if 0 <= v <= 1:
        return 1 + v * 4
    return None


def self_report_wellbeing_0_100(answers: dict) -> tuple[float, int]:
    """
    Returns (score_0_100, n_items_used). If n_items_used == 0, score is a neutral 50.
    """
    if not answers:
        return 50.0, 0

    highs: list[float] = []
    lows: list[float] = []  # inverted (high raw = bad)

    for k, v in answers.items():
        sk = str(k)
        val = _as_score_1_5(v)
        if val is None:
            continue

        if sk in ("stress_anxiety", "lonely_around_others"):
            lows.append(val)
            continue
        if sk in WELLBEING_LIKERT_KEYS:
            highs.append(val)
            continue
        if sk.startswith(QOL_STYLE_PREFIXES):
            highs.append(val)
            continue

    items: list[float] = []
    for h in highs:
        items.append((h - 1) / 4 * 100)
    for low in lows:
        items.append((5 - low) / 4 * 100)

    if not items:
        return 50.0, 0

    return float(sum(items) / len(items)), len(items)


def model_qol_raw_to_0_100(qol_raw: float) -> float:
    """
    Map QoL regression raw output to 0–100.

    ElderSense training target scale can differ by export; we branch on magnitude:
    - (0,1)     → proportion → ×100
    - [1,5]     → classic 1–5 Likert → linear to 0–100
    - (5,10]    → treat as 0–10 short scale (NOT 0–100), so e.g. 7 → 70
    - (10,100]  → already on 0–100
    - else      → soft fallback

    Blending with self-report in blended_qol_0_100() reduces trust issues when this guess is wrong.
    """
    import numpy as np

    q = float(qol_raw)
    if 0.0 <= q < 1.0:
        return float(np.clip(q * 100, 0, 100))
    if 1.0 <= q <= 5.0:
        return float(np.clip((q - 1) / 4 * 100, 0, 100))
    # Values like 6–10 are ambiguous if we use (5,100] as direct 0–100 (6 would mean 6%).
    if 5.0 < q <= 10.0:
        return float(np.clip(q / 10.0 * 100, 0, 100))
    if 10.0 < q <= 100.0:
        return float(np.clip(q, 0, 100))
    return float(np.clip(50 + q * 10, 0, 100))


def blended_qol_0_100(qol_raw: float, answers: dict) -> tuple[float, float, int]:
    """
    Returns (blended_0_100, model_component_0_100, n_self_report_items).
    """
    model_pct = model_qol_raw_to_0_100(qol_raw)
    self_pct, n = self_report_wellbeing_0_100(answers)
    if n == 0:
        return model_pct, model_pct, 0
    if n >= 8:
        w_model, w_self = 0.35, 0.65
    elif n >= 4:
        w_model, w_self = 0.45, 0.55
    else:
        w_model, w_self = 0.55, 0.45
    blended = w_model * model_pct + w_self * self_pct
    return float(max(0, min(100, blended))), model_pct, n
