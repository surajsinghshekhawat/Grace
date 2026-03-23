"""
Encoding, imputation, and scaling. All fitters (encoder, imputer, scaler) must be fit on train only when used in CV.
"""
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer

# Binary/categorical values to map to 0/1
YES_VALS = {"yes", "y", "1", 1, 1.0, "present", "true"}
NO_VALS = {"no", "n", "0", 0, 0.0, "not present", "false", "absent"}


def _to_str_lower(x):
    if pd.isna(x):
        return np.nan
    return str(x).strip().lower()


def map_binary_columns(X, columns=None):
    """Map yes/no, present/not present to 0/1. If columns None, infer from object dtype and unique values."""
    X = X.copy()
    if columns is None:
        columns = []
        for c in X.columns:
            u = X[c].dropna().astype(str).str.lower().str.strip().unique()
            if len(u) <= 4 and any(v in {"yes", "no", "present", "not present", "y", "n"} for v in u):
                columns.append(c)
    for c in columns:
        if c not in X.columns:
            continue
        s = X[c].apply(_to_str_lower)
        out = np.zeros(len(X))
        out[:] = np.nan
        for i, v in enumerate(s):
            if pd.isna(v) or v == "":
                continue
            if v in YES_VALS or v == "present":
                out[i] = 1
            elif v in NO_VALS or v in {"not present", "absent"}:
                out[i] = 0
        X[c] = out
    return X


def encode_categorical(X, columns=None, fit_encoder=None, drop_first=True):
    """
    One-hot encode categorical columns. Returns (X_encoded, encoder_or_None).
    If fit_encoder is an existing OneHotEncoder, use it to transform; otherwise fit new one.
    """
    if columns is None:
        # Infer: object dtype or low-cardinality int
        columns = [c for c in X.columns if X[c].dtype == object or (X[c].dtype in [np.int64, np.float64] and X[c].nunique() < 15)]
    if not columns:
        return X, fit_encoder
    X_cat = X[columns].astype(str).fillna("__NA__")
    X_rest = X.drop(columns=columns, errors="ignore")
    if fit_encoder is not None:
        X_enc = fit_encoder.transform(X_cat)
        if hasattr(X_enc, "toarray"):
            X_enc = X_enc.toarray()
        enc_cols = fit_encoder.get_feature_names_out(columns)
        X_enc_df = pd.DataFrame(X_enc, columns=enc_cols, index=X.index)
    else:
        enc = OneHotEncoder(drop="first" if drop_first else None, handle_unknown="ignore", sparse_output=False)
        X_enc = enc.fit_transform(X_cat)
        enc_cols = enc.get_feature_names_out(columns)
        X_enc_df = pd.DataFrame(X_enc, columns=enc_cols, index=X.index)
        fit_encoder = enc
    X_out = pd.concat([X_rest.reset_index(drop=True), X_enc_df.reset_index(drop=True)], axis=1)
    return X_out, fit_encoder


def impute_fit_transform(X_train, X_test, strategy_numeric="median", strategy_categorical="most_frequent"):
    """Fit SimpleImputer on X_train, transform both. Returns (X_train_imp, X_test_imp, imputer)."""
    numeric_cols = X_train.select_dtypes(include=[np.number]).columns.tolist()
    other_cols = [c for c in X_train.columns if c not in numeric_cols]
    imputer_num = SimpleImputer(strategy=strategy_numeric)
    imputer_cat = SimpleImputer(strategy=strategy_categorical) if other_cols else None
    X_train_imp = X_train.copy()
    X_test_imp = X_test.copy()
    if numeric_cols:
        X_train_imp[numeric_cols] = imputer_num.fit_transform(X_train[numeric_cols])
        X_test_imp[numeric_cols] = imputer_num.transform(X_test[numeric_cols])
    if imputer_cat is not None and other_cols:
        X_train_imp[other_cols] = imputer_cat.fit_transform(X_train[other_cols])
        X_test_imp[other_cols] = imputer_cat.transform(X_test[other_cols])
    return X_train_imp, X_test_imp, (imputer_num, imputer_cat)


def scale_fit_transform(X_train, X_test, scaler=None):
    """Fit StandardScaler on X_train, transform both. Returns (X_train_scaled, X_test_scaled, scaler)."""
    if scaler is None:
        scaler = StandardScaler()
    X_train_scaled = pd.DataFrame(
        scaler.fit_transform(X_train),
        columns=X_train.columns,
        index=X_train.index
    )
    X_test_scaled = pd.DataFrame(
        scaler.transform(X_test),
        columns=X_test.columns,
        index=X_test.index
    )
    return X_train_scaled, X_test_scaled, scaler


def preprocess_for_fold(X_train, X_test, y_train_dep=None, encode=True, impute=True, scale=True,
                         encoder=None, imputers=None, scaler=None):
    """
    Apply binary mapping, optional one-hot, imputation, scaling. Fit on train only.
    Returns (X_train_pp, X_test_pp, state_dict) with state_dict containing encoder, imputers, scaler for reuse.
    """
    state = {}
    X_tr = X_train.copy()
    X_te = X_test.copy()
    # Binary mapping (no fit)
    X_tr = map_binary_columns(X_tr)
    X_te = map_binary_columns(X_te)
    # Coerce numeric where possible
    for c in X_tr.columns:
        X_tr[c] = pd.to_numeric(X_tr[c], errors="ignore")
        X_te[c] = pd.to_numeric(X_te[c], errors="ignore")
    if encode:
        X_tr, enc = encode_categorical(X_tr, fit_encoder=encoder)
        X_te, _ = encode_categorical(X_te, fit_encoder=enc)
        state["encoder"] = enc
    if impute:
        X_tr, X_te, imps = impute_fit_transform(X_tr, X_te)
        state["imputers"] = imps
    # Ensure all numeric after impute
    X_tr = X_tr.astype(float)
    X_te = X_te.astype(float)
    if scale:
        X_tr, X_te, sc = scale_fit_transform(X_tr, X_te, scaler=scaler)
        state["scaler"] = sc
    return X_tr, X_te, state
