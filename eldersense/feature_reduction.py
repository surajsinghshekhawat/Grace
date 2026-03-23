"""
Phase 4 Step 21: Feature reduction on training set only.
(1) Variance filter: drop near-constant columns.
(2) Correlation filter: drop one of each pair with |r| > 0.9.
(3) LASSO (L1 logistic regression for depression): keep non-zero coefficients.
Target ~20–50 features. Returns selected feature names for use in Step 22.
"""
import numpy as np
import pandas as pd
from sklearn.feature_selection import VarianceThreshold
from sklearn.linear_model import LogisticRegression, Lasso


def _drop_high_correlation(X, threshold=0.9):
    """
    Drop columns so that no pair has |correlation| > threshold.
    Greedy: keep first column in each highly correlated pair, drop the other.
    Returns list of column names to keep.
    """
    if X.shape[1] <= 1:
        return X.columns.tolist()
    corr = X.corr().abs()
    # Writable copy: pandas/numpy may expose a read-only view; np.fill_diagonal mutates in-place.
    mat = np.asarray(corr.values, dtype=float).copy()
    np.fill_diagonal(mat, 0.0)
    cols = corr.columns.tolist()
    to_drop = set()
    for i in range(mat.shape[0]):
        if cols[i] in to_drop:
            continue
        for j in range(i + 1, mat.shape[1]):
            if cols[j] in to_drop:
                continue
            if mat[i, j] > threshold:
                to_drop.add(cols[j])  # drop j, keep i
    return [c for c in X.columns if c not in to_drop]


def reduce_features(
    X_train,
    y_train_depression,
    *,
    variance_threshold=0.0,
    correlation_threshold=0.9,
    lasso_C=0.1,
    lasso_max_iter=2000,
    random_state=42,
    target_min_features=20,
    target_max_features=50,
):
    """
    Run variance filter, then correlation filter, then LASSO (L1 logistic) on X_train.
    Fit LASSO for depression (y_train_depression); keep features with non-zero coefficient.
    Returns (selected_feature_names, state) where state can be used to document the pipeline.
    All operations use only X_train / y_train (no test leakage).
    """
    X = X_train.copy()
    if isinstance(X, pd.DataFrame):
        cols = X.columns.tolist()
    else:
        X = pd.DataFrame(X)
        cols = list(range(X.shape[1]))
        X.columns = [str(i) for i in cols]

    # (1) Variance filter
    vt = VarianceThreshold(threshold=variance_threshold)
    vt.fit(X)
    mask = vt.get_support()
    cols_after_var = [c for c, m in zip(cols, mask) if m]
    X = X.loc[:, cols_after_var]

    if len(cols_after_var) == 0:
        return cols_after_var, {"variance": cols_after_var, "correlation": [], "lasso": []}

    # (2) Correlation filter
    cols_after_corr = _drop_high_correlation(X, threshold=correlation_threshold)
    X = X[cols_after_corr]

    if len(cols_after_corr) == 0:
        return cols_after_corr, {"variance": cols_after_var, "correlation": [], "lasso": []}

    # (3) LASSO (L1 logistic regression)
    y = np.asarray(y_train_depression).ravel()
    model = LogisticRegression(
        solver="saga",
        l1_ratio=1.0,
        C=lasso_C,
        max_iter=lasso_max_iter,
        random_state=random_state,
    )
    model.fit(X, y)
    coef = model.coef_.ravel()
    selected = [c for c, w in zip(cols_after_corr, coef) if w != 0]

    # If LASSO drops too many, fall back to top by |coefficient| up to target_max_features
    if len(selected) < target_min_features and len(cols_after_corr) >= target_min_features:
        order = np.argsort(np.abs(coef))[::-1]
        selected = [cols_after_corr[i] for i in order[: max(target_min_features, len(selected))]]
    elif len(selected) > target_max_features:
        order = np.argsort(np.abs(coef))[::-1]
        selected = [cols_after_corr[i] for i in order[:target_max_features]]

    state = {
        "variance_kept": cols_after_var,
        "correlation_kept": cols_after_corr,
        "lasso_selected": selected,
    }
    return selected, state


def reduce_features_qol(
    X_train,
    y_train_qol,
    *,
    variance_threshold=0.0,
    correlation_threshold=0.9,
    lasso_alpha=0.01,
    lasso_max_iter=5000,
    random_state=42,
    target_min_features=20,
    target_max_features=50,
):
    """
    Same pipeline as reduce_features (variance → correlation) but L1 **regression** (Lasso) on QoL.
    Uses only X_train / y_train_qol (no leakage). For comparing QoL-optimised feature sets vs depression-driven selection.
    """
    X = X_train.copy()
    if isinstance(X, pd.DataFrame):
        cols = X.columns.tolist()
    else:
        X = pd.DataFrame(X)
        cols = list(range(X.shape[1]))
        X.columns = [str(i) for i in cols]

    vt = VarianceThreshold(threshold=variance_threshold)
    vt.fit(X)
    mask = vt.get_support()
    cols_after_var = [c for c, m in zip(cols, mask) if m]
    X = X.loc[:, cols_after_var]

    if len(cols_after_var) == 0:
        return cols_after_var, {"variance": cols_after_var, "correlation": [], "lasso_qol": []}

    cols_after_corr = _drop_high_correlation(X, threshold=correlation_threshold)
    X = X[cols_after_corr]

    if len(cols_after_corr) == 0:
        return cols_after_corr, {"variance": cols_after_var, "correlation": [], "lasso_qol": []}

    y = np.asarray(y_train_qol).ravel().astype(float)
    model = Lasso(
        alpha=lasso_alpha,
        max_iter=lasso_max_iter,
        random_state=random_state,
    )
    model.fit(X, y)
    coef = model.coef_.ravel()
    selected = [c for c, w in zip(cols_after_corr, coef) if w != 0]

    if len(selected) < target_min_features and len(cols_after_corr) >= target_min_features:
        order = np.argsort(np.abs(coef))[::-1]
        selected = [cols_after_corr[i] for i in order[: max(target_min_features, len(selected))]]
    elif len(selected) > target_max_features:
        order = np.argsort(np.abs(coef))[::-1]
        selected = [cols_after_corr[i] for i in order[:target_max_features]]

    state = {
        "variance_kept": cols_after_var,
        "correlation_kept": cols_after_corr,
        "lasso_qol_selected": selected,
    }
    return selected, state


def reduce_features_union_depression_qol(
    X_train,
    y_train_depression,
    y_train_qol,
    *,
    variance_threshold=0.0,
    correlation_threshold=0.9,
    lasso_C=0.1,
    lasso_alpha_qol=0.01,
    lasso_max_iter_logistic=2000,
    lasso_max_iter_lasso=5000,
    random_state=42,
    target_min_features=20,
    target_max_features=50,
):
    """
    Union of depression (logistic LASSO) and QoL (Lasso regression) selections after shared variance+correlation
    filters. If union exceeds target_max_features, keep features that appear in either top-k by |coef| ranking
    (depression first, then add QoL-only until cap).
    """
    sel_dep, st_dep = reduce_features(
        X_train,
        y_train_depression,
        variance_threshold=variance_threshold,
        correlation_threshold=correlation_threshold,
        lasso_C=lasso_C,
        lasso_max_iter=lasso_max_iter_logistic,
        random_state=random_state,
        target_min_features=target_min_features,
        target_max_features=target_max_features,
    )
    sel_qol, st_qol = reduce_features_qol(
        X_train,
        y_train_qol,
        variance_threshold=variance_threshold,
        correlation_threshold=correlation_threshold,
        lasso_alpha=lasso_alpha_qol,
        lasso_max_iter=lasso_max_iter_lasso,
        random_state=random_state,
        target_min_features=target_min_features,
        target_max_features=target_max_features,
    )
    union = list(dict.fromkeys(sel_dep + sel_qol))  # preserve order, unique
    if len(union) > target_max_features:
        # Prefer depression list order, then QoL-only
        dep_set = set(sel_dep)
        qol_only = [c for c in sel_qol if c not in dep_set]
        union = sel_dep + qol_only
        union = union[:target_max_features]
    state = {"depression": st_dep, "qol": st_qol, "union_selected": union}
    return union, state
