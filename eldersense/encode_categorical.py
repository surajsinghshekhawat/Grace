"""
Phase 3 Step 15: One-hot encode categorical columns.
Demo: 4,5,6,7,8,9,10,12,14,15,16,17,18. HSB: 1.1, 2.1 (perception), 5,6,7, 1.2, 2.2, 3.1, 4.1.
For CV: fit encoder on train only; for now fit on full X to get a working pipeline.
"""
import numpy as np
import pandas as pd
from sklearn.preprocessing import OneHotEncoder

# Categorical columns to one-hot (must be present in X)
CATEGORICAL_COLUMNS = [
    "demo_4", "demo_5", "demo_6", "demo_7", "demo_8", "demo_9", "demo_10",
    "demo_12", "demo_14", "demo_15", "demo_16", "demo_17", "demo_18",
    "hsb_1.1", "hsb_2.1",
    "hsb_5", "hsb_6", "hsb_7", "hsb_1.2", "hsb_2.2", "hsb_3.1", "hsb_4.1",
]
# demo_23 (open text) and demo_24 (MSPSS) are not one-hot here; drop or handle in Step 16/17.
MISSING_PLACEHOLDER = "__missing__"


def _get_categorical_columns_in_df(df):
    """Return only those in CATEGORICAL_COLUMNS that exist in df."""
    return [c for c in CATEGORICAL_COLUMNS if c in df.columns]


def one_hot_encode(
    X,
    encoder=None,
    fit=True,
    drop="first",
    handle_unknown="ignore",
):
    """
    One-hot encode categorical columns in X. Other columns left unchanged.
    X: DataFrame with 107 predictor columns (after binary encoding).
    encoder: fitted OneHotEncoder (required if fit=False).
    fit: if True, fit encoder on X; if False, use provided encoder to transform only.
    drop: 'first' to drop first category per feature (avoid multicollinearity), or None.
    handle_unknown: 'ignore' so test folds with unseen categories don't break.
    Returns: (X_encoded DataFrame, encoder). X_encoded has only numeric columns.
    """
    cat_cols = _get_categorical_columns_in_df(X)
    if not cat_cols:
        return X.copy(), encoder

    other_cols = [c for c in X.columns if c not in cat_cols]
    X_other = X[other_cols].copy()
    X_cat = X[cat_cols].copy()
    # Fill NaN so OneHotEncoder doesn't fail
    X_cat = X_cat.fillna(MISSING_PLACEHOLDER).astype(str)

    if fit or encoder is None:
        encoder = OneHotEncoder(drop=drop, handle_unknown=handle_unknown, sparse_output=False)
        encoded = encoder.fit_transform(X_cat)
    else:
        encoded = encoder.transform(X_cat)

    cat_names = encoder.get_feature_names_out(cat_cols)
    X_encoded = pd.DataFrame(
        encoded,
        columns=cat_names,
        index=X.index,
    )
    # Combine with non-categorical; ensure numeric types for other columns
    for c in other_cols:
        X_encoded[c] = pd.to_numeric(X_other[c], errors="coerce")
    # Reorder so other cols appear first, then one-hot (optional; keep simple)
    out_cols = other_cols + list(cat_names)
    X_out = X_encoded[out_cols]
    return X_out, encoder
