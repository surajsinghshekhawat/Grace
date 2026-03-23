"""
Phase 7 Step 36: Export final model(s) for reporting.
Refit on 80% of data (stratified) with same pipeline (impute, scale, feature reduction).
Save: depression model, QoL model, selected feature names, scaler, impute state.
"""
import json
import os
import numpy as np
import pandas as pd

try:
    from eldersense.targets import get_X_y
    from eldersense.cv_folds import get_fold_indices
    from eldersense.impute import impute_fit_transform, impute_transform
    from eldersense.scale import scale_fit_transform, scale_transform
    from eldersense.feature_reduction import reduce_features
except ModuleNotFoundError:
    from targets import get_X_y
    from cv_folds import get_fold_indices
    from impute import impute_fit_transform, impute_transform
    from scale import scale_fit_transform, scale_transform
    from feature_reduction import reduce_features

try:
    import joblib
    HAS_JOBLIB = True
except ImportError:
    HAS_JOBLIB = False

try:
    from xgboost import XGBClassifier, XGBRegressor
    HAS_XGB = True
except ImportError:
    HAS_XGB = False

EXPORT_DIR_NAME = "export"
TRAIN_FRAC = 0.8
RANDOM_STATE = 42


def _single_split(X, y_depression, train_frac=TRAIN_FRAC, random_state=RANDOM_STATE):
    """One stratified 80/20 split (indices)."""
    from sklearn.model_selection import train_test_split
    idx = np.arange(len(X))
    train_idx, test_idx = train_test_split(
        idx, test_size=1 - train_frac, stratify=y_depression, random_state=random_state
    )
    return train_idx, test_idx


def fit_export_pipeline(out_dir=None, random_state=RANDOM_STATE):
    """
    Run pipeline on 80% train: impute, scale, feature reduce, train XGBoost dep + QoL.
    Save models, selected_features, scaler, impute_state to out_dir (default eldersense/data/export/).
    Returns dict with paths and selected_features.
    """
    if not HAS_JOBLIB:
        raise ImportError("joblib required: pip install joblib")
    if not HAS_XGB:
        raise ImportError("xgboost required for export_model.py")

    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if out_dir is None:
        out_dir = os.path.join(base, "eldersense", "data", EXPORT_DIR_NAME)
    os.makedirs(out_dir, exist_ok=True)

    X_raw, y_depression, y_qol = get_X_y(impute=False, scale=False)
    X_raw = pd.DataFrame(X_raw).reset_index(drop=True)
    y_depression = np.asarray(y_depression).ravel()
    y_qol = np.asarray(y_qol).ravel()

    train_idx, _ = _single_split(X_raw, y_depression, train_frac=TRAIN_FRAC, random_state=random_state)
    X_train = X_raw.iloc[train_idx].copy()
    y_dep_train = y_depression[train_idx]
    y_qol_train = y_qol[train_idx]

    X_train_imp, impute_state = impute_fit_transform(X_train, drop_all_nan=True)
    X_train_sc, scaler = scale_fit_transform(X_train_imp)
    selected, reduce_state = reduce_features(X_train_sc, y_dep_train, random_state=random_state)
    if not selected:
        selected = X_train_sc.columns.tolist()[:1]
    X_train_red = X_train_sc[selected]

    model_dep = XGBClassifier(n_estimators=100, random_state=random_state)
    model_dep.fit(X_train_red, y_dep_train)
    model_qol = XGBRegressor(n_estimators=100, random_state=random_state)
    model_qol.fit(X_train_red, y_qol_train)

    joblib.dump(model_dep, os.path.join(out_dir, "model_depression.joblib"))
    joblib.dump(model_qol, os.path.join(out_dir, "model_qol.joblib"))
    joblib.dump(scaler, os.path.join(out_dir, "scaler.joblib"))
    joblib.dump(impute_state, os.path.join(out_dir, "impute_state.joblib"))
    with open(os.path.join(out_dir, "selected_features.json"), "w") as f:
        json.dump(selected, f, indent=0)

    # For inference: backend needs columns_kept and medians to build default row
    imp, cols_dropped, columns_kept = impute_state
    with open(os.path.join(out_dir, "columns_kept.json"), "w") as f:
        json.dump(columns_kept, f, indent=0)
    feature_medians = {c: float(imp.statistics_[i]) for i, c in enumerate(columns_kept)}
    with open(os.path.join(out_dir, "feature_medians.json"), "w") as f:
        json.dump(feature_medians, f, indent=2)

    with open(os.path.join(out_dir, "README_export.txt"), "w") as f:
        f.write("ElderSense export: refit on 80%% train with same pipeline.\n")
        f.write("Files: model_depression.joblib, model_qol.joblib, scaler.joblib, impute_state.joblib, selected_features.json.\n")
        f.write("To predict: load X (same encoding as get_X_y), apply impute_transform(X, impute_state), scale_transform(X, scaler), then X[selected_features]; model_dep.predict(X_red), model_qol.predict(X_red).\n")
    print(f"Exported to {out_dir}: models, scaler, impute_state, selected_features.json")
    return {"out_dir": out_dir, "selected_features": selected}


if __name__ == "__main__":
    fit_export_pipeline()
    print("Phase 7 export done.")
