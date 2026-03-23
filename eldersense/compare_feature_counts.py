"""
Compare performance with fewer features (sensitivity analysis).
Run: python eldersense/compare_feature_counts.py
Uses current 20-50 vs stricter 20-30 (fewer features).
"""
import os
import numpy as np

try:
    from eldersense.fold_pipeline import run_fold_pipeline
    from eldersense.baselines import run_all_baselines
except ModuleNotFoundError:
    from fold_pipeline import run_fold_pipeline
    from baselines import run_all_baselines

def main():
    results_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "results")

    # (1) Current: target 20-50 (actual ~42-49 per fold)
    print("Running pipeline with target 20-50 features (current default)...")
    fold_results_default = run_fold_pipeline(
        n_splits=5, random_state=42, verbose=True,
        target_min_features=20, target_max_features=50,
    )
    dep1, qol1, _ = run_all_baselines(fold_results_default, verbose=False)
    n_feat_default = [len(r["selected_features"]) for r in fold_results_default]
    print(f"  Features per fold: {n_feat_default} (mean {np.mean(n_feat_default):.0f})")

    # (2) Fewer: target 20-30
    print("\nRunning pipeline with target 20-30 features (fewer)...")
    fold_results_fewer = run_fold_pipeline(
        n_splits=5, random_state=42, verbose=True,
        target_min_features=20, target_max_features=30,
    )
    dep2, qol2, _ = run_all_baselines(fold_results_fewer, verbose=False)
    n_feat_fewer = [len(r["selected_features"]) for r in fold_results_fewer]
    print(f"  Features per fold: {n_feat_fewer} (mean {np.mean(n_feat_fewer):.0f})")

    # Compare (best models: RF and XGB for depression; XGB for QoL)
    print("\n" + "="*60)
    print("COMPARISON (mean over 5 folds)")
    print("="*60)
    def row(df, model):
        m = df[df["model"] == model]
        return m.iloc[0] if len(m) else None
    for name, dep_a, dep_b, qol_a, qol_b in [
        ("LogisticRegression / ElasticNet", dep1.iloc[0], dep2.iloc[0], qol1.iloc[0], qol2.iloc[0]),
        ("RandomForest", row(dep1, "RandomForest"), row(dep2, "RandomForest"), row(qol1, "RandomForest"), row(qol2, "RandomForest")),
        ("XGBoost", row(dep1, "XGBoost"), row(dep2, "XGBoost"), row(qol1, "XGBoost"), row(qol2, "XGBoost")),
    ]:
        if dep_a is None:
            continue
        print("\n{}:".format(name))
        print("  Depression (20-50): AUC={:.3f}  F1={:.3f}  Acc={:.3f}".format(dep_a["AUC"], dep_a["F1"], dep_a["Accuracy"]))
        print("  Depression (20-30): AUC={:.3f}  F1={:.3f}  Acc={:.3f}".format(dep_b["AUC"], dep_b["F1"], dep_b["Accuracy"]))
        if qol_a is not None and qol_b is not None:
            print("  QoL (20-50): RMSE={:.3f}  R2={:.3f}".format(qol_a["RMSE"], qol_a["R2"]))
            print("  QoL (20-30): RMSE={:.3f}  R2={:.3f}".format(qol_b["RMSE"], qol_b["R2"]))
    print("\nConclusion: Fewer features may improve (less overfitting) or worsen (lose signal).")
    print("If 20-30 is better overall, consider target_max_features=30 in the main pipeline.")

if __name__ == "__main__":
    main()
