"""
Phase 7 Steps 33–35: SHAP explainability.
Use TreeExplainer for XGBoost (depression) and XGBoost (QoL) on one fold.
Produce global feature importance (mean |SHAP|), top 15 per task, shared determinants.
Produce local explanations for 2–3 example participants.
"""
import os
import numpy as np
import pandas as pd

try:
    from eldersense.fold_pipeline import run_fold_pipeline
except ModuleNotFoundError:
    from fold_pipeline import run_fold_pipeline

try:
    import shap
    HAS_SHAP = True
except ImportError:
    HAS_SHAP = False

try:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    HAS_MPL = True
except ImportError:
    HAS_MPL = False

# Use fold 0 for a single set of models and feature set
EXPLAIN_FOLD = 0
BACKGROUND_SAMPLE = 150  # background for TreeExplainer (speed)
EXPLAIN_SAMPLE = 200    # rows to compute SHAP for global importance
TOP_K = 15
N_LOCAL_EXAMPLES = 3


def _get_models_and_data(fold_results, random_state=42):
    """Train XGBoost depression and XGBoost QoL on fold 0; return models and arrays."""
    try:
        from xgboost import XGBClassifier, XGBRegressor
    except ImportError:
        raise ImportError("xgboost required for explain.py")
    r = fold_results[EXPLAIN_FOLD]
    X_tr = np.asarray(r["X_train_red"], dtype=np.float32)
    X_te = np.asarray(r["X_test_red"], dtype=np.float32)
    y_dep_tr = np.asarray(r["y_dep_train"]).ravel()
    y_qol_tr = np.asarray(r["y_qol_train"]).ravel()
    feature_names = r["X_train_red"].columns.tolist()

    clf = XGBClassifier(n_estimators=100, random_state=random_state)
    clf.fit(X_tr, y_dep_tr)
    reg = XGBRegressor(n_estimators=100, random_state=random_state)
    reg.fit(X_tr, y_qol_tr)

    return {
        "X_train": X_tr,
        "X_test": X_te,
        "y_dep_test": r["y_dep_test"],
        "y_qol_test": r["y_qol_test"],
        "feature_names": feature_names,
        "model_dep": clf,
        "model_qol": reg,
    }


def compute_global_importance(data, out_dir, background_sample=BACKGROUND_SAMPLE, explain_sample=EXPLAIN_SAMPLE):
    """TreeExplainer on XGBoost dep and QoL; mean |SHAP| per feature; save CSV and note shared."""
    if not HAS_SHAP:
        print("SHAP not installed. pip install shap")
        print(
            "Without SHAP, shap_importance_*.csv and shap_shared_top15.csv are not updated; "
            "python -m eldersense.plot_figures will still plot any existing CSVs (possibly stale)."
        )
        return None, None

    X_train = data["X_train"]
    X_test = data["X_test"]
    feature_names = data["feature_names"]
    n_back = min(background_sample, len(X_train))
    n_explain = min(explain_sample, len(X_test))
    background_idx = np.random.RandomState(42).choice(len(X_train), size=n_back, replace=False)
    explain_idx = np.random.RandomState(43).choice(len(X_test), size=n_explain, replace=False)
    X_back = X_train[background_idx]
    X_explain = X_test[explain_idx]

    # Depression
    explainer_dep = shap.TreeExplainer(data["model_dep"], X_back, feature_perturbation="interventional")
    shap_dep = explainer_dep.shap_values(X_explain)
    if isinstance(shap_dep, list):
        shap_dep = shap_dep[1]  # positive class
    mean_abs_dep = np.abs(shap_dep).mean(axis=0)
    rank_dep = np.argsort(mean_abs_dep)[::-1]
    top_dep = [feature_names[i] for i in rank_dep[:TOP_K]]
    imp_dep = pd.DataFrame({"feature": feature_names, "mean_abs_shap": mean_abs_dep}).sort_values("mean_abs_shap", ascending=False)
    imp_dep.to_csv(os.path.join(out_dir, "shap_importance_depression.csv"), index=False)

    # QoL
    explainer_qol = shap.TreeExplainer(data["model_qol"], X_back, feature_perturbation="interventional")
    shap_qol = explainer_qol.shap_values(X_explain)
    mean_abs_qol = np.abs(shap_qol).mean(axis=0)
    rank_qol = np.argsort(mean_abs_qol)[::-1]
    top_qol = [feature_names[i] for i in rank_qol[:TOP_K]]
    imp_qol = pd.DataFrame({"feature": feature_names, "mean_abs_shap": mean_abs_qol}).sort_values("mean_abs_shap", ascending=False)
    imp_qol.to_csv(os.path.join(out_dir, "shap_importance_qol.csv"), index=False)

    shared_set = set(top_dep) & set(top_qol)
    # Stable order: depression global rank (top_dep) among intersection — not set() iteration order
    shared = [f for f in top_dep if f in shared_set]
    shared_df = pd.DataFrame({"shared_determinant": shared if shared else [""]})
    shared_df.to_csv(os.path.join(out_dir, "shap_shared_top15.csv"), index=False)
    print(f"Top {TOP_K} depression: {top_dep[:5]}...")
    print(f"Top {TOP_K} QoL: {top_qol[:5]}...")
    print(f"Shared in top-{TOP_K} ({len(shared)}): {shared}")

    return {
        "shap_dep": shap_dep,
        "shap_qol": shap_qol,
        "X_explain": X_explain,
        "feature_names": feature_names,
        "explainer_dep": explainer_dep,
        "explainer_qol": explainer_qol,
    }, (imp_dep, imp_qol)


def plot_local_explanations(shap_data, out_dir, n_examples=N_LOCAL_EXAMPLES):
    """Bar plot of SHAP for 2–3 example participants (depression and QoL)."""
    if not HAS_SHAP or not HAS_MPL:
        return
    X_explain = shap_data["X_explain"]
    feature_names = shap_data["feature_names"]
    explain_idx = np.arange(min(n_examples, len(X_explain)))

    for task, key_shap, key_explainer, title_prefix in [
        ("depression", "shap_dep", "explainer_dep", "Depression"),
        ("qol", "shap_qol", "explainer_qol", "QoL"),
    ]:
        shaps = shap_data[key_shap]
        for i in explain_idx:
            shap_values_i = shaps[i]
            order = np.argsort(np.abs(shap_values_i))[::-1][:15]
            fig, ax = plt.subplots(figsize=(8, 5))
            ax.barh(range(len(order)), shap_values_i[order], color=["#1E88E5" if s > 0 else "#D32F2F" for s in shap_values_i[order]])
            ax.set_yticks(range(len(order)))
            ax.set_yticklabels([feature_names[j] for j in order], fontsize=8)
            ax.set_xlabel("SHAP value")
            ax.set_title(f"{title_prefix} — Local explanation (participant {i})")
            ax.invert_yaxis()
            plt.tight_layout()
            plt.savefig(os.path.join(out_dir, f"shap_local_{task}_participant_{i}.png"), dpi=120, bbox_inches="tight")
            plt.close()
    print(f"Saved {n_examples} local plots per task to {out_dir}")


def run_explainability(fold_results=None, out_dir=None, random_state=42):
    """Run SHAP pipeline: train on fold 0, global importance, shared list, local plots."""
    if out_dir is None:
        out_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "eldersense", "data", "results")
    os.makedirs(out_dir, exist_ok=True)

    if fold_results is None:
        fold_results = run_fold_pipeline(n_splits=5, random_state=random_state, verbose=True)
    data = _get_models_and_data(fold_results, random_state=random_state)
    shap_data, _ = compute_global_importance(data, out_dir)
    if shap_data:
        plot_local_explanations(shap_data, out_dir)
    return shap_data


if __name__ == "__main__":
    run_explainability()
    print("Phase 7 explainability done.")
