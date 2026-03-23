"""
Phase 3 Step 14: Map binary columns (Yes/No, Present/Not present) to 0/1.
Applies to CGA (all 32), Demo (11, 19, 20, 21, 22), and any HSB column that is strictly Yes/No.
"""
import pandas as pd
import numpy as np


def _normalize(s):
    """Lowercase string, strip; return '' for non-string or NaN."""
    if pd.isna(s):
        return ""
    return str(s).lower().strip()


def _map_cga_to_01(ser):
    """
    CGA: Present/Not present, Yes/No, or numeric (1-8 sub-items).
    Map: yes, present, or any numeric >= 1 -> 1; no, not present, na, 0, blank -> 0.
    """
    out = np.zeros(len(ser), dtype=int)
    for i, v in enumerate(ser):
        s = _normalize(v)
        if s in ("yes", "present", "1", "2", "3", "4", "5", "6", "7", "8"):
            out[i] = 1
        elif s in ("no", "not present", "na", "0", ""):
            out[i] = 0
        else:
            # try numeric
            try:
                n = float(s)
                out[i] = 1 if n >= 1 else 0
            except (ValueError, TypeError):
                out[i] = 0
    return out


def _map_demo_binary(ser, positive_values):
    """Map to 0/1: values in positive_values -> 1, else -> 0. Handles a/b/c and yes/no."""
    out = np.zeros(len(ser), dtype=int)
    pos_set = {str(x).lower().strip() for x in positive_values}
    for i, v in enumerate(ser):
        s = _normalize(v)
        if s in pos_set:
            out[i] = 1
        elif pd.isna(v) or s == "":
            out[i] = np.nan  # keep missing
        else:
            out[i] = 0
    return out


# Demo binary columns and their "positive" (1) codes from codebook
# demo_11: Having children -> a=Yes=1, b=No=0
# demo_19: History of abuse -> a/c could mean abuse present -> 1, b=no abuse -> 0
# demo_20: Perceived dignity -> a=Yes=1, b=No=0
# demo_21: Part of old-age association -> a=Yes=1, b=No=0
# demo_22: Part of social welfare association -> a=Yes=1, b=No=0
DEMO_BINARY_CONFIG = {
    "demo_11": ("a",),   # Yes = 1
    "demo_19": ("a", "c"),  # abuse present (verbal/physical)
    "demo_20": ("a",),   # Yes = 1
    "demo_21": ("a",),   # Yes = 1
    "demo_22": ("a",),   # Yes = 1
}


def _cga_columns(df):
    return [c for c in df.columns if c.startswith("cga_")]


def encode_binary_columns(df):
    """
    In-place encode binary columns to 0/1.
    - CGA: all columns -> yes/present/numeric>=1 -> 1; no/not present/blank -> 0.
    - Demo 11, 19, 20, 21, 22 -> codebook mapping (a=Yes etc.) -> 1, else 0.
    Returns df (modified in place).
    """
    df = df.copy()

    # CGA: all 32
    for c in _cga_columns(df):
        if c not in df.columns:
            continue
        df[c] = _map_cga_to_01(df[c])

    # Demo binaries
    for col, positive in DEMO_BINARY_CONFIG.items():
        if col not in df.columns:
            continue
        arr = _map_demo_binary(df[col], positive)
        df[col] = arr  # may contain NaN for missing

    return df
