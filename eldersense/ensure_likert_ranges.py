"""
Phase 3 Step 17: Ensure MSPSS (1-7) and HSB Part C (1-5) are numeric and in valid range.
Coerce to numeric; clip out-of-range values to [1,7] and [1,5] respectively.
"""
import numpy as np
import pandas as pd

MSPSS_COLUMNS = [f"mspss_{i}" for i in range(1, 13)]
MSPSS_MIN, MSPSS_MAX = 1, 7

HSB_PART_C_COLUMNS = [
    "hsb_1.3", "hsb_2.3", "hsb_3.2", "hsb_4.2", "hsb_5.1", "hsb_6.1", "hsb_7.1",
    "hsb_8", "hsb_9", "hsb_10", "hsb_11",
]
HSB_C_MIN, HSB_C_MAX = 1, 5


def ensure_likert_ranges(X, clip=True, report=True):
    """
    Ensure MSPSS columns are numeric in [1, 7] and HSB Part C in [1, 5].
    Coerce to numeric (invalid -> NaN); if clip=True, clip in-range values to bounds.
    If report=True, print counts of coerced and out-of-range (before clip).
    Returns X (modified in place on a copy).
    """
    X = X.copy()
    n_out = 0
    for c in MSPSS_COLUMNS:
        if c not in X.columns:
            continue
        orig = X[c]
        v = pd.to_numeric(orig, errors="coerce")
        out = ((v < MSPSS_MIN) | (v > MSPSS_MAX)) & v.notna()
        n_out += out.sum()
        if clip:
            v = v.clip(lower=MSPSS_MIN, upper=MSPSS_MAX)
        X[c] = v

    for c in HSB_PART_C_COLUMNS:
        if c not in X.columns:
            continue
        v = pd.to_numeric(X[c], errors="coerce")
        out = ((v < HSB_C_MIN) | (v > HSB_C_MAX)) & v.notna()
        n_out += out.sum()
        if clip:
            v = v.clip(lower=HSB_C_MIN, upper=HSB_C_MAX)
        X[c] = v

    if report and n_out > 0:
        print(f"Step 17: Clipped {int(n_out)} out-of-range Likert value(s) to valid range.")
    return X
