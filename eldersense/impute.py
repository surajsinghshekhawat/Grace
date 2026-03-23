"""
Phase 3 Step 18: Imputation — median for numeric.
After encoding, X is all numeric; use SimpleImputer(strategy='median').
Columns that are 100% NaN are dropped (no information); fit on train, transform train and test in CV.
"""
import numpy as np
import pandas as pd
from sklearn.impute import SimpleImputer


def _cols_all_nan(X):
    """Column names that are 100% NaN."""
    return X.columns[X.isna().all()].tolist()


def impute(
    X,
    imputer=None,
    fit=True,
    drop_all_nan=True,
):
    """
    Impute missing values: median for all columns (X is numeric after encoding).
    If drop_all_nan=True, drop columns that are 100% NaN before imputation (and store for transform).
    Returns (X_imputed, state) where state = (fitted_imputer, cols_dropped, columns_kept) for CV transform.
    """
    X = X.copy()
    cols_dropped = []
    if drop_all_nan:
        cols_dropped = _cols_all_nan(X)
        if cols_dropped:
            X = X.drop(columns=cols_dropped)
    columns_kept = X.columns.tolist()

    if fit or imputer is None:
        imp = SimpleImputer(strategy="median")
        X_imputed = pd.DataFrame(
            imp.fit_transform(X),
            columns=columns_kept,
            index=X.index,
        )
        state = (imp, cols_dropped, columns_kept)
        return X_imputed, state

    imp, cols_dropped_fit, columns_kept_fit = imputer
    if cols_dropped_fit:
        X = X.drop(columns=[c for c in cols_dropped_fit if c in X.columns], errors="ignore")
    X = X.reindex(columns=columns_kept_fit)  # same order as fit; new cols -> NaN
    X_imputed = pd.DataFrame(
        imp.transform(X),
        columns=columns_kept_fit,
        index=X.index,
    )
    return X_imputed, imputer


def impute_fit_transform(X, drop_all_nan=True):
    """
    One-shot: fit on X and transform X. Returns (X_imputed, state).
    Use state in impute(X_test, imputer=state, fit=False) for test data in CV.
    """
    return impute(X, imputer=None, fit=True, drop_all_nan=drop_all_nan)


def impute_transform(X, state):
    """Transform test data using fitted state from impute_fit_transform."""
    X_imputed, _ = impute(X, imputer=state, fit=False, drop_all_nan=False)
    return X_imputed
