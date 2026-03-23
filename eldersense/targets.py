"""
Build depression and QoL targets, define predictor set X.
GDS-15: items 1,5,7,11,13 → depression when "no"; others when "yes". Binary: 1 if total >= 5.
WHOQOL-BREF: four domains (Physical, Psychological, Social, Environment), then mean of domain means.
Phase 3 Step 14: Binary columns (CGA, Demo 11/19/20/21/22) are encoded to 0/1 before building X.
"""
import os
import numpy as np
import pandas as pd

try:
    from eldersense.encode_binary import encode_binary_columns
    from eldersense.encode_categorical import one_hot_encode
    from eldersense.code_hsb_text import code_hsb_part_a
    from eldersense.ensure_likert_ranges import ensure_likert_ranges
    from eldersense.impute import impute_fit_transform
    from eldersense.scale import scale_fit_transform
except ModuleNotFoundError:
    from encode_binary import encode_binary_columns
    from encode_categorical import one_hot_encode
    from code_hsb_text import code_hsb_part_a
    from ensure_likert_ranges import ensure_likert_ranges
    from impute import impute_fit_transform
    from scale import scale_fit_transform

# Default: load from eldersense/data/merged.csv if run from project root
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MERGED_PATH = os.path.join(PROJECT_ROOT, "eldersense", "data", "merged.csv")

# GDS-15: 1-based item numbers; depression = 1 when "no" for these, when "yes" for others
GDS_DEPRESSION_WHEN_NO = {1, 5, 7, 11, 13}  # 1-based
GDS_CUTOFF = 5

# WHOQOL-BREF 26 items: 1-based. Domain mapping (WHO manual). Items 3, 4, 26 reverse-scored (6 - x).
WHOQOL_DOMAIN1_ITEMS = [3, 4, 15, 16, 17, 18]        # Physical (3,4 reverse)
WHOQOL_DOMAIN2_ITEMS = [5, 6, 7, 11, 19, 26]         # Psychological (26 reverse)
WHOQOL_DOMAIN3_ITEMS = [20, 21, 22]                  # Social
WHOQOL_DOMAIN4_ITEMS = [8, 9, 10, 12, 13, 14, 23, 24, 25]  # Environment
WHOQOL_REVERSE_ITEMS = {3, 4, 26}


def _gds_columns(df):
    return [c for c in df.columns if c.startswith("gds_") and c[4:].replace(".", "").isdigit() or c in [f"gds_{i}" for i in range(1, 16)]]


def _map_yes_no_to_01(ser):
    """Map yes/no (or 1/0) to 0/1. Accepts yes, no, 1, 0, True, False."""
    if ser.dtype == bool or (ser.dropna().isin([0, 1]).all() and ser.dropna().isin([0, 1, 1.0, 0.0]).all()):
        return ser.fillna(0).astype(int)
    s = ser.astype(str).str.lower().str.strip()
    return s.map({"yes": 1, "no": 0, "1": 1, "0": 0, "true": 1, "false": 0}).fillna(0).astype(int)


def build_gds_total(df):
    """GDS-15 total (0-15). Items 1,5,7,11,13: point when no=1; others: point when yes=1."""
    gds_cols = [f"gds_{i}" for i in range(1, 16)]
    if not all(c in df.columns for c in gds_cols):
        # Fallback: any column starting with gds_
        gds_cols = sorted([c for c in df.columns if c.startswith("gds_")], key=lambda x: (len(x), x))[:15]
    total = np.zeros(len(df))
    for i, col in enumerate(gds_cols):
        one_based = i + 1
        val = _map_yes_no_to_01(df[col])
        if one_based in GDS_DEPRESSION_WHEN_NO:
            total += (1 - val).values  # depression when no
        else:
            total += val.values
    return total.astype(int)


def build_depression_target(df, gds_total=None, cutoff=None):
    """Binary depression: 1 if GDS total >= cutoff (default: GDS_CUTOFF, typically 5)."""
    if cutoff is None:
        cutoff = GDS_CUTOFF
    if gds_total is None:
        gds_total = build_gds_total(df)
    return (np.asarray(gds_total) >= cutoff).astype(int)


def build_whoqol_domains(df):
    """Four domain scores (mean of items per domain). Items 3,4,26 reverse-scored as 6-x."""
    def get_item(df, i):
        c = f"whoqol_{i}"
        if c not in df.columns:
            return np.nan
        x = pd.to_numeric(df[c], errors="coerce")
        if i in WHOQOL_REVERSE_ITEMS:
            x = 6 - x  # reverse
        return x

    def domain_mean(items):
        vals = [get_item(df, i) for i in items]
        stack = np.column_stack([np.asarray(v) for v in vals])
        return np.nanmean(stack, axis=1)

    d1 = domain_mean(WHOQOL_DOMAIN1_ITEMS)
    d2 = domain_mean(WHOQOL_DOMAIN2_ITEMS)
    d3 = domain_mean(WHOQOL_DOMAIN3_ITEMS)
    d4 = domain_mean(WHOQOL_DOMAIN4_ITEMS)
    return d1, d2, d3, d4


def build_qol_target(df):
    """QoL = mean of the four WHOQOL-BREF domain means."""
    d1, d2, d3, d4 = build_whoqol_domains(df)
    return np.nanmean([d1, d2, d3, d4], axis=0)


def get_X_y(
    df=None,
    drop_target_missing=True,
    encode_categorical=True,
    impute=True,
    scale=True,
    gds_cutoff=None,
):
    """
    Return X (predictors only), y_depression, y_qol.
    Drops gds_* and whoqol_* from X. Optionally drop rows with missing targets.
    If encode_categorical=True (default), one-hot encode categorical columns (Phase 3 Step 15).
    If impute=True (default), impute remaining NaNs with median and drop 100%-NaN columns (Phase 3 Step 18).
    If scale=True (default), StandardScaler on all features (Phase 3 Step 19). For CV, fit on train only.
    """
    if df is None:
        df = pd.read_csv(MERGED_PATH)
    df = df.copy()
    # Phase 3 Step 14: encode binary columns (CGA, Demo) to 0/1
    df = encode_binary_columns(df)
    # Duplicates (Phase 2 Step 8)
    n_before = len(df)
    df = df.drop_duplicates()
    n_dup = n_before - len(df)
    print(f"Duplicate rows: {n_dup} dropped (n_rows: {n_before} -> {len(df)})")

    # Targets
    gds_total = build_gds_total(df)
    y_dep = build_depression_target(df, gds_total, cutoff=gds_cutoff)
    y_qol = build_qol_target(df)
    df["_gds_total"] = gds_total
    df["_y_depression"] = y_dep
    df["_y_qol"] = y_qol

    # Predictor set: drop GDS and WHOQOL columns
    drop_cols = [c for c in df.columns if c.startswith("gds_") or c.startswith("whoqol_")]
    X = df.drop(columns=drop_cols + ["_gds_total", "_y_depression", "_y_qol"], errors="ignore")
    y_depression = df["_y_depression"].values
    y_qol = df["_y_qol"].values

    if drop_target_missing:
        miss = np.isnan(y_qol) | np.isnan(y_depression)
        if miss.any():
            X = X.loc[~miss].reset_index(drop=True)
            y_depression = y_depression[~miss]
            y_qol = y_qol[~miss]
            print(f"Dropped {miss.sum()} rows with missing targets.")

    # Phase 3 Step 17: ensure MSPSS (1-7) and HSB Part C (1-5) are numeric and in range
    X = ensure_likert_ranges(X, clip=True, report=True)

    # Phase 3 Step 16: replace HSB Part A open text (hsb_1..4) with keyword binary columns
    X = code_hsb_part_a(X)

    # Phase 3 Step 15: one-hot encode categorical columns (fit on full X for now; CV will fit on train)
    if encode_categorical:
        X, _ = one_hot_encode(X, fit=True)

    # Phase 3 Step 18: impute NaNs (median); drop 100%-NaN columns. For CV, fit on train only.
    if impute:
        X, _ = impute_fit_transform(X, drop_all_nan=True)

    # Phase 3 Step 19: StandardScaler on all features. For CV, fit on train only.
    if scale:
        X, _ = scale_fit_transform(X)

    n_pos = int((y_depression == 1).sum())
    print(f"Depression: n_positive={n_pos}, n_negative={len(y_depression)-n_pos}, prevalence={100*n_pos/len(y_depression):.1f}%")
    print(f"QoL: mean={np.nanmean(y_qol):.2f}, std={np.nanstd(y_qol):.2f}")
    print(f"X shape: {X.shape}")
    return X, y_depression, y_qol


def missingness_report(df, path=None):
    """Report missing per column; save to path if given."""
    miss = df.isnull().sum()
    miss_pct = (100 * miss / len(df)).round(1)
    report = pd.DataFrame({"missing": miss, "pct": miss_pct}).sort_values("missing", ascending=False)
    if path:
        report.to_csv(path)
        print(f"Missingness report saved: {path}")
    return report


if __name__ == "__main__":
    df = pd.read_csv(MERGED_PATH)
    miss_report = missingness_report(df, os.path.join(PROJECT_ROOT, "eldersense", "data", "missingness.csv"))
    X, y_dep, y_qol = get_X_y(df)
    print("Targets and X built successfully.")
