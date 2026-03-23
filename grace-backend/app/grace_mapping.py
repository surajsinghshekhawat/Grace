"""
Map Grace questionnaire answers (dict of question_id -> value) to ElderSense feature names.
Returns a dict of feature_name -> value for the selected_features we can derive.
Unmapped features are filled with median in predict.py.
"""
import re
from typing import Any


# Grace age -> demo_4 one-hot (research: A=60-65, B=66-70, C=71-75, D=76-80, E=81+)
AGE_TO_DEMO_4 = {
    "60-65": "demo_4_a",
    "66-70": "demo_4_b",
    "71-75": "demo_4_c",
    "76-80": "demo_4_d",
    "81+": "demo_4_e",
}

# Grace gender -> demo_5 one-hot (A=male, B=female, C=other)
GENDER_TO_DEMO_5 = {
    "male": "demo_5_a",
    "female": "demo_5_b",
    "prefer_not_say": "demo_5_c",
}

# Grace education -> demo_7 one-hot (simplified: a..e)
EDUCATION_TO_DEMO_7 = {
    "no_formal": "demo_7_a",
    "primary": "demo_7_b",
    "secondary": "demo_7_c",
    "higher_secondary": "demo_7_d",
    "graduate_above": "demo_7_e",
}

# Grace occupation -> demo_8
OCCUPATION_TO_DEMO_8 = {
    "employed": "demo_8_a",
    "retired": "demo_8_b",
    "homemaker": "demo_8_c",
    "unemployed": "demo_8_d",
}

# Grace income -> demo_9
INCOME_TO_DEMO_9 = {
    "less_10k": "demo_9_a",
    "10k_30k": "demo_9_b",
    "30k_50k": "demo_9_c",
    "more_50k": "demo_9_d",
}

# Grace area_type -> demo_10
AREA_TO_DEMO_10 = {
    "urban": "demo_10_a",
    "semi_urban": "demo_10_b",
    "rural": "demo_10_c",
}

# Grace family_type -> demo_12
FAMILY_TYPE_TO_DEMO_12 = {
    "nuclear": "demo_12_a",
    "joint": "demo_12_b",
    "alone": "demo_12_c",
}

# Grace housing -> demo_14
HOUSING_TO_DEMO_14 = {
    "own": "demo_14_a",
    "rented": "demo_14_b",
    "with_family": "demo_14_c",
}

# One-hot: we set 1 for the matched column; others stay 0 (or median). So we only output the column that is 1.
def _one_hot(grace_value: Any, mapping: dict, selected_cols: set) -> dict:
    out = {}
    if grace_value is None or grace_value == "":
        return out
    col = mapping.get(str(grace_value).strip().lower())
    if col and col in selected_cols:
        out[col] = 1.0
    return out


def _numeric(value: Any, lo: float, hi: float) -> float | None:
    if value is None:
        return None
    try:
        v = float(value)
        return max(lo, min(hi, v))
    except (TypeError, ValueError):
        return None


def grace_answers_to_feature_dict(answers: dict, selected_features: list[str]) -> dict[str, float]:
    """
    Build a dict of feature_name -> value for features we can derive from Grace answers.
    Only includes keys that are in selected_features. Caller fills the rest with median.
    """
    sel = set(selected_features)
    out: dict[str, float] = {}

    def a(qid: str) -> Any:
        return answers.get(qid)

    # Demographics - one-hot (only the column that is 1)
    for col in _one_hot(a("age"), AGE_TO_DEMO_4, sel):
        out[col] = 1.0
    for col in _one_hot(a("gender"), GENDER_TO_DEMO_5, sel):
        out[col] = 1.0
    for col in _one_hot(a("education"), EDUCATION_TO_DEMO_7, sel):
        out[col] = 1.0
    for col in _one_hot(a("occupation"), OCCUPATION_TO_DEMO_8, sel):
        out[col] = 1.0
    for col in _one_hot(a("income"), INCOME_TO_DEMO_9, sel):
        out[col] = 1.0
    for col in _one_hot(a("area_type"), AREA_TO_DEMO_10, sel):
        out[col] = 1.0
    for col in _one_hot(a("family_type"), FAMILY_TYPE_TO_DEMO_12, sel):
        out[col] = 1.0
    for col in _one_hot(a("housing"), HOUSING_TO_DEMO_14, sel):
        out[col] = 1.0

    # Binary: demo_11 (having children), demo_22 (social welfare). Grace: dependents -> demo_11; no direct demo_22
    if "demo_11" in sel:
        dep = a("dependents")
        if dep is not None:
            out["demo_11"] = 1.0 if str(dep).lower() in ("yes", "y", "1") else 0.0
    if "demo_22" in sel:
        # No Grace question; leave for median (don't set)

        # demo_17_no, demo_18_no: often "no" = 1 for the _no column (e.g. health_insurance no -> demo_17_no?)
        pass
    if "demo_17_no" in sel:
        hi = a("health_insurance")
        if hi is not None:
            out["demo_17_no"] = 1.0 if str(hi).lower() in ("no", "n") else 0.0
    if "demo_18_no" in sel:
        # e.g. internet_access no
        ia = a("internet_access")
        if ia is not None:
            out["demo_18_no"] = 1.0 if str(ia).lower() in ("no", "n") else 0.0

    # CGA: Grace has health/cognitive sections. Map to cga_Unnamed: 3, 5, 6, 10, 25 if we have close questions
    # CGA columns in selected: cga_Unnamed: 3, cga_Unnamed: 5, cga_Unnamed: 6, cga_Unnamed: 10, cga_Unnamed: 25
    # Use 0/1. If we don't have mapping, leave for median.
    for c in ["cga_Unnamed: 3", "cga_Unnamed: 5", "cga_Unnamed: 6", "cga_Unnamed: 10", "cga_Unnamed: 25"]:
        if c in sel and c not in out:
            out[c] = 0.0  # default CGA absent

    # MSPSS 1-7: Grace social section uses 1-5 Likert; scale to 1-7: (x-1)*(6/4)+1
    mspss_grace = [
        ("mspss_1", "family_interaction"),
        ("mspss_3", "friends_interaction"),
        ("mspss_5", "respect"),
        ("mspss_7", "community_activities"),
        ("mspss_8", "lonely_around_others"),
        ("mspss_12", "social_satisfaction"),
    ]
    for feat, qid in mspss_grace:
        if feat not in sel:
            continue
        val = a(qid)
        v = _numeric(val, 1, 5)
        if v is not None:
            out[feat] = (v - 1) * (6 / 4) + 1  # 1-5 -> 1-7

    # HSB Part C (1-5): map from health_care section
    if "hsb_2.3" in sel:
        v = _numeric(a("doctor_visit"), 1, 5)
        if v is not None:
            out["hsb_2.3"] = v
    if "hsb_4.2" in sel:
        v = _numeric(a("health_checkups"), 1, 5)
        if v is not None:
            out["hsb_4.2"] = v
    if "hsb_7.1" in sel:
        v = _numeric(a("medication"), 1, 5)
        if v is not None:
            out["hsb_7.1"] = v
    if "hsb_11" in sel:
        v = _numeric(a("healthcare_access"), 1, 5)
        if v is not None:
            out["hsb_11"] = v

    # HSB keyword from text (health_care or free text)
    text = (a("health_activities_text") or a("health_care_notes") or "").lower()
    if "hsb_mentions_yoga" in sel:
        out["hsb_mentions_yoga"] = 1.0 if "yoga" in text else 0.0
    if "hsb_mentions_meditation" in sel:
        out["hsb_mentions_meditation"] = 1.0 if "meditation" in text else 0.0

    # HSB one-hot (simplified)
    for col in ["hsb_1.1_Poor", "hsb_2.1_Better", "hsb_2.1_Good", "hsb_5_b", "hsb_5_d", "hsb_5_no", "hsb_7_a", "hsb_7_b", "hsb_1.2_b", "hsb_2.2_d", "hsb_3.1_c", "hsb_4.1_a", "hsb_4.1_b"]:
        if col in sel and col not in out:
            out[col] = 0.0  # default

    return out
