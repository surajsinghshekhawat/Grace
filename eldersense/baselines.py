"""
Phase 5: Baseline models — train on each fold, record metrics, aggregate.
Depression: Logistic Regression (L1), Random Forest, XGBoost → AUC, F1, Precision, Recall, Accuracy.
QoL: ElasticNet, Random Forest regressor, XGBoost regressor → RMSE, MSE, R².
Optional: use_class_weight=True for balanced LR / RF and scale_pos_weight for XGBoost (see run_depression_baselines).
"""
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression, ElasticNet
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    mean_squared_error,
    r2_score,
)

try:
    from eldersense.fold_pipeline import run_fold_pipeline
except ModuleNotFoundError:
    from fold_pipeline import run_fold_pipeline

# XGBoost required for full baselines (see requirements.txt)
_XGB_IMPORT_ERROR = None
try:
    from xgboost import XGBClassifier, XGBRegressor
    HAS_XGB = True
except ImportError as e:
    HAS_XGB = False
    _XGB_IMPORT_ERROR = e

DEPRESSION_METRICS = ["AUC", "F1", "Precision", "Recall", "Accuracy"]
QOL_METRICS = ["RMSE", "MSE", "R2"]


def _depression_metrics(y_true, y_pred, y_prob=None):
    """Compute AUC, F1, Precision, Recall, Accuracy. y_prob for AUC (probabilities)."""
    out = {}
    out["Accuracy"] = accuracy_score(y_true, y_pred)
    out["Precision"] = precision_score(y_true, y_pred, zero_division=0)
    out["Recall"] = recall_score(y_true, y_pred, zero_division=0)
    out["F1"] = f1_score(y_true, y_pred, zero_division=0)
    if y_prob is not None and len(np.unique(y_true)) == 2:
        try:
            out["AUC"] = roc_auc_score(y_true, y_prob)
        except Exception:
            out["AUC"] = np.nan
    else:
        out["AUC"] = np.nan
    return out


def _qol_metrics(y_true, y_pred):
    """Compute RMSE, MSE, R²."""
    mse = mean_squared_error(y_true, y_pred)
    return {"MSE": mse, "RMSE": np.sqrt(mse), "R2": r2_score(y_true, y_pred)}


def _class_weight_for_xgb(y_train):
    """scale_pos_weight for XGBoost: n_neg / n_pos for binary y."""
    y = np.asarray(y_train).ravel()
    n_pos = (y == 1).sum()
    n_neg = (y == 0).sum()
    if n_pos == 0:
        return 1.0
    return float(n_neg) / float(n_pos)


def run_depression_baselines(fold_results, random_state=42, verbose=False, use_class_weight=False):
    """Train LogisticRegression (L1), RandomForest, XGBoost on each fold; return per-fold and aggregated metrics.

    If use_class_weight is True, LogisticRegression uses class_weight='balanced' and XGBClassifier uses
    scale_pos_weight = n_negative / n_positive (per fold). RandomForest is unchanged (optional extension: class_weight).
    """
    all_folds = []
    for r in fold_results:
        X_tr = r["X_train_red"]
        X_te = r["X_test_red"]
        y_tr = r["y_dep_train"]
        y_te = r["y_dep_test"]

        fold_metrics = {}

        cw = "balanced" if use_class_weight else None
        # Logistic Regression L1
        # Pure L1 with saga: set l1_ratio=1.0 and omit penalty (sklearn ≥1.8 deprecates penalty="l1" + default l1_ratio)
        m = LogisticRegression(
            solver="saga",
            l1_ratio=1.0,
            C=0.1,
            max_iter=2000,
            random_state=random_state,
            class_weight=cw,
        )
        m.fit(X_tr, y_tr)
        pred = m.predict(X_te)
        prob = m.predict_proba(X_te)[:, 1]
        fold_metrics["LogisticRegression_L1"] = _depression_metrics(y_te, pred, prob)

        # Random Forest
        m = RandomForestClassifier(
            n_estimators=100,
            random_state=random_state,
            class_weight=cw if use_class_weight else None,
        )
        m.fit(X_tr, y_tr)
        pred = m.predict(X_te)
        prob = m.predict_proba(X_te)[:, 1]
        fold_metrics["RandomForest"] = _depression_metrics(y_te, pred, prob)

        # XGBoost (2.x compatible)
        if HAS_XGB:
            try:
                spw = _class_weight_for_xgb(y_tr) if use_class_weight else None
                kwargs = dict(n_estimators=100, random_state=random_state)
                if spw is not None:
                    kwargs["scale_pos_weight"] = spw
                m = XGBClassifier(**kwargs)
                m.fit(X_tr, y_tr)
                pred = m.predict(X_te)
                prob = m.predict_proba(X_te)[:, 1]
                fold_metrics["XGBoost"] = _depression_metrics(y_te, pred, prob)
            except Exception as e:
                fold_metrics["XGBoost"] = {k: np.nan for k in DEPRESSION_METRICS}
                if verbose:
                    import traceback
                    print(f"XGBoost depression fold failed: {e}")
                    traceback.print_exc()
        else:
            fold_metrics["XGBoost"] = {k: np.nan for k in DEPRESSION_METRICS}

        all_folds.append(fold_metrics)

    # Aggregate: rows = models, columns = metric (mean ± SD)
    models = list(all_folds[0].keys())
    agg = []
    for model in models:
        row = {"model": model}
        for metric in DEPRESSION_METRICS:
            vals = [all_folds[f][model][metric] for f in range(len(all_folds))]
            vals = [v for v in vals if not np.isnan(v)]
            mean = np.mean(vals) if vals else np.nan
            std = np.std(vals) if len(vals) > 1 else 0
            row[metric] = mean
            row[f"{metric}_std"] = std
        agg.append(row)
    return pd.DataFrame(agg), all_folds


def run_qol_baselines(fold_results, random_state=42, verbose=False):
    """Train ElasticNet, RandomForest regressor, XGBoost regressor on each fold; return aggregated metrics."""
    all_folds = []
    for r in fold_results:
        X_tr = r["X_train_red"]
        X_te = r["X_test_red"]
        y_tr = r["y_qol_train"]
        y_te = r["y_qol_test"]

        fold_metrics = {}

        # ElasticNet
        m = ElasticNet(alpha=0.1, l1_ratio=0.5, random_state=random_state)
        m.fit(X_tr, y_tr)
        pred = m.predict(X_te)
        fold_metrics["ElasticNet"] = _qol_metrics(y_te, pred)

        # Random Forest regressor
        m = RandomForestRegressor(n_estimators=100, random_state=random_state)
        m.fit(X_tr, y_tr)
        pred = m.predict(X_te)
        fold_metrics["RandomForest"] = _qol_metrics(y_te, pred)

        # XGBoost regressor
        if HAS_XGB:
            try:
                m = XGBRegressor(n_estimators=100, random_state=random_state)
                m.fit(X_tr, y_tr)
                pred = m.predict(X_te)
                fold_metrics["XGBoost"] = _qol_metrics(y_te, pred)
            except Exception as e:
                fold_metrics["XGBoost"] = {k: np.nan for k in QOL_METRICS}
                if verbose:
                    import traceback
                    print(f"XGBoost QoL fold failed: {e}")
                    traceback.print_exc()
        else:
            fold_metrics["XGBoost"] = {k: np.nan for k in QOL_METRICS}

        all_folds.append(fold_metrics)

    models = list(all_folds[0].keys())
    agg = []
    for model in models:
        row = {"model": model}
        for metric in QOL_METRICS:
            vals = [all_folds[f][model][metric] for f in range(len(all_folds))]
            vals = [v for v in vals if not np.isnan(v)]
            mean = np.mean(vals) if vals else np.nan
            std = np.std(vals) if len(vals) > 1 else 0
            row[metric] = mean
            row[f"{metric}_std"] = std
        agg.append(row)
    return pd.DataFrame(agg), all_folds


def _json_float(x):
    if x is None:
        return None
    if isinstance(x, (float, np.floating)) and np.isnan(x):
        return None
    return float(x)


def per_fold_metrics_dict(dep_folds, qol_folds):
    """
    Convert nested per-fold metric dicts to a JSON-serialisable structure:
    depression -> model -> metric -> [v_fold0, ...], qol -> model -> metric -> [...]
    Lists preserve fold order; nulls encode NaN / missing.
    """
    if not dep_folds or not qol_folds:
        return {"depression": {}, "qol": {}}
    dep_models = list(dep_folds[0].keys())
    qol_models = list(qol_folds[0].keys())
    out = {"depression": {}, "qol": {}}
    for model in dep_models:
        out["depression"][model] = {}
        for metric in DEPRESSION_METRICS:
            out["depression"][model][metric] = [
                _json_float(dep_folds[f][model][metric]) for f in range(len(dep_folds))
            ]
    for model in qol_models:
        out["qol"][model] = {}
        for metric in QOL_METRICS:
            out["qol"][model][metric] = [
                _json_float(qol_folds[f][model][metric]) for f in range(len(qol_folds))
            ]
    return out


def save_per_fold_metrics_json(dep_folds, qol_folds, path, extra_meta=None):
    """Write per-fold vectors for bootstrap / reviewer-requested CIs."""
    import json
    import os

    payload = {
        "depression_metrics_order": DEPRESSION_METRICS,
        "qol_metrics_order": QOL_METRICS,
        "n_folds": len(dep_folds),
        "metrics": per_fold_metrics_dict(dep_folds, qol_folds),
    }
    if extra_meta:
        payload["meta"] = extra_meta
    parent = os.path.dirname(os.path.abspath(path))
    if parent:
        os.makedirs(parent, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
    return path


def run_all_baselines(fold_results=None, random_state=42, verbose=True, save_dir=None):
    """
    Run depression and QoL baselines across all folds.
    If fold_results is None, runs run_fold_pipeline(verbose=False) first.
    If save_dir is set, saves depression_metrics.csv and qol_metrics.csv there.
    If save_dir is set, also writes per_fold_metrics.json alongside CSVs (for bootstrap CIs).
    Returns (depression_df, qol_df, fold_results).
    """
    if not HAS_XGB and verbose:
        print("Warning: XGBoost not installed. Install with: pip install xgboost")
        print("  Import error:", _XGB_IMPORT_ERROR)
    if fold_results is None:
        fold_results = run_fold_pipeline(n_splits=5, random_state=random_state, verbose=False)
    dep_df, dep_folds = run_depression_baselines(
        fold_results, random_state=random_state, verbose=verbose, use_class_weight=False
    )
    qol_df, qol_folds = run_qol_baselines(fold_results, random_state=random_state, verbose=verbose)
    if verbose:
        print("=== Depression (mean ± SD over 5 folds) ===")
        print(dep_df.to_string(index=False))
        print("\n=== QoL (mean ± SD over 5 folds) ===")
        print(qol_df.to_string(index=False))
    if save_dir:
        import os
        os.makedirs(save_dir, exist_ok=True)
        dep_df.to_csv(os.path.join(save_dir, "depression_metrics.csv"), index=False)
        qol_df.to_csv(os.path.join(save_dir, "qol_metrics.csv"), index=False)
        json_path = os.path.join(save_dir, "per_fold_metrics.json")
        save_per_fold_metrics_json(
            dep_folds,
            qol_folds,
            json_path,
            extra_meta={"random_state": random_state, "n_splits": len(fold_results)},
        )
        if verbose:
            print(f"\nSaved tables and {json_path} to {save_dir}")
    return dep_df, qol_df, fold_results


if __name__ == "__main__":
    import os
    PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out_dir = os.path.join(PROJECT_ROOT, "eldersense", "data", "results")
    dep_df, qol_df, _ = run_all_baselines(random_state=42, save_dir=out_dir)
    print("\nPhase 5 baselines complete.")
