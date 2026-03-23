"""
Phase 3 Step 16: Code HSB Part A (open text) into keyword-based binary features.
hsb_1 (concept of health), hsb_2 (measures to maintain), hsb_3 (prevent illness), hsb_4 (mental health)
are replaced by binary flags: mentions_diet, mentions_exercise, mentions_sleep, mentions_rest,
mentions_yoga, mentions_meditation, mentions_work. Documented in ELDERSENSE_ENCODING_REFERENCE.md.
"""
import pandas as pd
import numpy as np

HSB_PART_A_COLUMNS = ["hsb_1", "hsb_2", "hsb_3", "hsb_4"]

# (column_suffix, list of keywords any of which triggers 1)
HSB_KEYWORD_RULES = [
    ("diet", ["diet", "food"]),
    ("exercise", ["exercise"]),
    ("sleep", ["sleep"]),
    ("rest", ["rest"]),
    ("yoga", ["yoga"]),
    ("meditation", ["meditation"]),
    ("work", ["work", "working"]),
]


def _text_contains_any(text, keywords):
    """True if any keyword appears in text (case-insensitive)."""
    if pd.isna(text) or text == "":
        return False
    s = str(text).lower()
    return any(kw.lower() in s for kw in keywords)


def code_hsb_part_a(X):
    """
    Replace hsb_1, hsb_2, hsb_3, hsb_4 with binary keyword columns.
    For each row, combine the four columns into one text; set hsb_mentions_<keyword> = 1
    if that keyword appears in the combined text, else 0. Missing in all four -> 0.
    Returns X with hsb_1..4 dropped and hsb_mentions_* added.
    """
    X = X.copy()
    present = [c for c in HSB_PART_A_COLUMNS if c in X.columns]
    if not present:
        return X

    # Combined text per row (concat non-null values)
    def row_text(row):
        parts = [str(row[c]).strip() for c in present if pd.notna(row[c]) and str(row[c]).strip() != ""]
        return " ".join(parts).lower()

    combined = X.apply(row_text, axis=1)

    for col_suffix, keywords in HSB_KEYWORD_RULES:
        col_name = f"hsb_mentions_{col_suffix}"
        X[col_name] = np.array([1 if _text_contains_any(t, keywords) else 0 for t in combined], dtype=np.int64)

    X = X.drop(columns=present, errors="ignore")
    return X
