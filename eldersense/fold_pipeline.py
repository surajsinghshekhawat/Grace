"""
Phase 4 Step 22: Per-fold pipeline — impute and scale on train only, then feature reduction.
For each fold: X_train_red, X_test_red, y_train, y_test (no leakage).
"""
import numpy as np
import pandas as pd

try:
    from eldersense.targets import get_X_y
    from eldersense.cv_folds import get_fold_indices
    from eldersense.impute import impute, impute_fit_transform, impute_transform
    from eldersense.scale import scale_fit_transform, scale_transform
    from eldersense.feature_reduction import (
        reduce_features,
        reduce_features_qol,
        reduce_features_union_depression_qol,
    )
except ModuleNotFoundError:
    from targets import get_X_y
    from cv_folds import get_fold_indices
    from impute import impute, impute_fit_transform, impute_transform
    from scale import scale_fit_transform, scale_transform
    from feature_reduction import (
        reduce_features,
        reduce_features_qol,
        reduce_features_union_depression_qol,
    )


def _reduce_kw_for_mode(reduce_kwargs, mode):
    """Build kwargs for feature reducers; avoid passing lasso_C to QoL Lasso or vice versa."""
    base = {
        "variance_threshold": reduce_kwargs.get("variance_threshold", 0.0),
        "correlation_threshold": reduce_kwargs.get("correlation_threshold", 0.9),
        "random_state": reduce_kwargs.get("random_state", 42),
        "target_min_features": reduce_kwargs.get("target_min_features", 20),
        "target_max_features": reduce_kwargs.get("target_max_features", 50),
    }
    if mode == "depression":
        base["lasso_C"] = reduce_kwargs.get("lasso_C", 0.1)
        base["lasso_max_iter"] = reduce_kwargs.get("lasso_max_iter", 2000)
    elif mode == "qol":
        base["lasso_alpha"] = reduce_kwargs.get("lasso_alpha", 0.01)
        base["lasso_max_iter"] = reduce_kwargs.get("lasso_max_iter_lasso", 5000)
    elif mode == "union":
        base["lasso_C"] = reduce_kwargs.get("lasso_C", 0.1)
        base["lasso_alpha_qol"] = reduce_kwargs.get("lasso_alpha", 0.01)
        base["lasso_max_iter_logistic"] = reduce_kwargs.get("lasso_max_iter", 2000)
        base["lasso_max_iter_lasso"] = reduce_kwargs.get("lasso_max_iter_lasso", 5000)
    return base


def run_fold_pipeline(
    X_raw=None,
    y_depression=None,
    y_qol=None,
    n_splits=5,
    random_state=42,
    verbose=True,
    feature_selection_target="depression",
    **reduce_kwargs,
):
    """
    Run the full per-fold pipeline: for each fold, impute (fit on train), scale (fit on train),
    feature reduce (on train), then subset train and test to selected features.
    Returns list of dicts, one per fold, with keys:
      X_train_red, X_test_red, y_dep_train, y_dep_test, y_qol_train, y_qol_test,
      selected_features, impute_state, scaler (for reproducibility).

    feature_selection_target:
      - "depression" (default): L1 logistic LASSO on depression (same feature set for both tasks).
      - "qol": Lasso regression on QoL (experimental; may improve QoL R² at cost of depression metrics).
      - "union": union of depression- and QoL-driven selections (capped; see reduce_features_union_depression_qol).
    """
    if X_raw is None or y_depression is None or y_qol is None:
        X_raw, y_depression, y_qol = get_X_y(impute=False, scale=False)
    X_raw = pd.DataFrame(X_raw).reset_index(drop=True)
    y_depression = np.asarray(y_depression).ravel()
    y_qol = np.asarray(y_qol).ravel()

    folds = get_fold_indices(y_depression, n_splits=n_splits, random_state=random_state)
    results = []

    for fold_i, (train_idx, test_idx) in enumerate(folds):
        X_train = X_raw.iloc[train_idx].copy()
        X_test = X_raw.iloc[test_idx].copy()
        y_dep_train = y_depression[train_idx]
        y_dep_test = y_depression[test_idx]
        y_qol_train = y_qol[train_idx]
        y_qol_test = y_qol[test_idx]

        # Impute: fit on train, transform train and test
        X_train_imp, impute_state = impute_fit_transform(X_train, drop_all_nan=True)
        X_test_imp = impute_transform(X_test, impute_state)

        # Scale: fit on train, transform both
        X_train_sc, scaler = scale_fit_transform(X_train_imp)
        X_test_sc = scale_transform(X_test_imp, scaler)

        # Feature reduction: on train only
        rk = _reduce_kw_for_mode(reduce_kwargs, feature_selection_target)
        if feature_selection_target == "depression":
            selected, reduce_state = reduce_features(X_train_sc, y_dep_train, **rk)
        elif feature_selection_target == "qol":
            selected, reduce_state = reduce_features_qol(X_train_sc, y_qol_train, **rk)
        elif feature_selection_target == "union":
            selected, reduce_state = reduce_features_union_depression_qol(
                X_train_sc, y_dep_train, y_qol_train, **rk
            )
        else:
            raise ValueError(
                "feature_selection_target must be 'depression', 'qol', or 'union'"
            )
        if not selected:
            selected = X_train_sc.columns.tolist()[:1]  # fallback: at least one col

        X_train_red = X_train_sc[selected].copy()
        X_test_red = X_test_sc[selected].copy()

        results.append({
            "fold": fold_i,
            "X_train_red": X_train_red,
            "X_test_red": X_test_red,
            "y_dep_train": y_dep_train,
            "y_dep_test": y_dep_test,
            "y_qol_train": y_qol_train,
            "y_qol_test": y_qol_test,
            "selected_features": selected,
            "impute_state": impute_state,
            "scaler": scaler,
            "reduce_state": reduce_state,
            "feature_selection_target": feature_selection_target,
        })
        if verbose:
            print(f"Fold {fold_i + 1}: train_red {X_train_red.shape}, test_red {X_test_red.shape}, "
                  f"n_features={len(selected)}")

    return results
