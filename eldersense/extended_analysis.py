"""
Extended evaluation helpers: feature stability, Brier score, calibration, bootstrap CIs,
GDS cutoff sensitivity, optional class-weighted baselines, QoL-driven feature selection comparison.

Run from project root: python -m eldersense.extended_analysis
"""
import os
import sys
import json
import numpy as np
import pandas as pd

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from sklearn.metrics import brier_score_loss, roc_curve
from sklearn.calibration import calibration_curve
from sklearn.utils import resample

try:
    from eldersense.fold_pipeline import run_fold_pipeline
    from eldersense.baselines import run_depression_baselines, run_qol_baselines, run_all_baselines
    from eldersense.targets import get_X_y
except ModuleNotFoundError:
    from fold_pipeline import run_fold_pipeline
    from baselines import run_depression_baselines, run_qol_baselines, run_all_baselines
    from targets import get_X_y


def feature_stability_across_folds(fold_results):
    """
    Jaccard overlap and counts: how many selected features appear in all folds vs any fold.
    Returns dict with per-fold n_features, intersection size, union size, mean pairwise Jaccard.
    """
    sets = [set(r["selected_features"]) for r in fold_results]
    inter = set.intersection(*sets) if sets else set()
    uni = set.union(*sets) if sets else set()
    n_folds = len(sets)
    jaccards = []
    for i in range(n_folds):
        for j in range(i + 1, n_folds):
            a, b = sets[i], sets[j]
            jaccards.append(len(a & b) / len(a | b) if (a | b) else 1.0)
    return {
        "n_folds": n_folds,
        "features_per_fold": [len(s) for s in sets],
        "intersection_all_folds_n": len(inter),
        "union_all_folds_n": len(uni),
        "mean_jaccard_pairwise": float(np.mean(jaccards)) if jaccards else np.nan,
        "intersection_feature_names": sorted(inter),
    }


def depression_brier_and_calibration_oof(fold_results, model_name="RandomForest"):
    """
    Concatenate OOF predictions across folds for RandomForest (or retrain per fold — already have test preds).
    Uses fold test predictions only (true OOF for each fold's test set).
    """
    y_true_all = []
    prob_all = []
    try:
        from sklearn.ensemble import RandomForestClassifier
    except ImportError:
        return {"brier": np.nan, "calibration_bins": None}

    for r in fold_results:
        X_tr, X_te = r["X_train_red"], r["X_test_red"]
        y_tr, y_te = r["y_dep_train"], r["y_dep_test"]
        m = RandomForestClassifier(n_estimators=100, random_state=42)
        m.fit(X_tr, y_tr)
        prob = m.predict_proba(X_te)[:, 1]
        y_true_all.append(np.asarray(y_te).ravel())
        prob_all.append(prob)
    y_true_all = np.concatenate(y_true_all)
    prob_all = np.concatenate(prob_all)
    brier = brier_score_loss(y_true_all, prob_all)
    prob_true, prob_pred = calibration_curve(y_true_all, prob_all, n_bins=10, strategy="uniform")
    return {
        "brier_score": float(brier),
        "n": len(y_true_all),
        "calibration_curve": {
            "mean_predicted_value": prob_pred.tolist(),
            "fraction_of_positives": prob_true.tolist(),
        },
    }


def bootstrap_fold_metric_ci(metric_values, n_boot=2000, seed=42, ci=0.95):
    """Bootstrap mean of fold-level metrics (5 values) with percentile CI."""
    rng = np.random.RandomState(seed)
    arr = np.asarray(metric_values, dtype=float)
    arr = arr[~np.isnan(arr)]
    if arr.size == 0:
        return (np.nan, np.nan)
    means = []
    for _ in range(n_boot):
        sample = rng.choice(arr, size=arr.size, replace=True)
        means.append(np.mean(sample))
    means = np.asarray(means)
    low_p = 100 * (1 - ci) / 2
    high_p = 100 - low_p
    return float(np.percentile(means, low_p)), float(np.percentile(means, high_p))


def bootstrap_all_from_per_fold_json(json_path, n_boot=5000, seed=42, ci=0.95):
    """
    Load eldersense/data/results/per_fold_metrics.json (from baselines.save_per_fold_metrics_json)
    and compute bootstrap 95% CIs for the mean of fold-wise metrics.
    """
    with open(json_path, encoding="utf-8") as f:
        data = json.load(f)
    metrics_blob = data.get("metrics", {})
    out = {"depression": {}, "qol": {}}
    for task in ("depression", "qol"):
        for model, md in metrics_blob.get(task, {}).items():
            out[task][model] = {}
            for metric, vals in md.items():
                arr = np.array([x for x in vals if x is not None], dtype=float)
                arr = arr[~np.isnan(arr)]
                if arr.size < 2:
                    continue
                lo, hi = bootstrap_fold_metric_ci(arr, n_boot=n_boot, seed=seed, ci=ci)
                out[task][model][metric] = {
                    "mean": float(np.mean(arr)),
                    "std": float(np.std(arr, ddof=1)) if arr.size > 1 else 0.0,
                    "ci95_low": lo,
                    "ci95_high": hi,
                    "n_folds": int(arr.size),
                }
    return out


def compare_gds_cutoffs(gds_cutoffs=(5, 6), random_state=42):
    """Run fold pipeline + depression baselines for each GDS cutoff; report mean AUC (primary)."""
    out = {}
    for c in gds_cutoffs:
        X_raw, y_dep, y_qol = get_X_y(
            impute=False, scale=False, gds_cutoff=c
        )
        folds = run_fold_pipeline(
            X_raw=X_raw,
            y_depression=y_dep,
            y_qol=y_qol,
            n_splits=5,
            random_state=random_state,
            verbose=False,
        )
        dep_df, _ = run_depression_baselines(folds, random_state=random_state, verbose=False)
        out[c] = dep_df.set_index("model").to_dict(orient="index")
    return out


def run_report(
    random_state=42,
    save_dir=None,
    run_cutoff_sensitivity=False,
    run_qol_selection_compare=False,
):
    """Compute stability, Brier/calibration, optional sensitivity analyses; write JSON + print summary."""
    save_dir = save_dir or os.path.join(PROJECT_ROOT, "eldersense", "data", "results")
    os.makedirs(save_dir, exist_ok=True)

    fold_results = run_fold_pipeline(n_splits=5, random_state=random_state, verbose=False)
    stab = feature_stability_across_folds(fold_results)
    brier_cal = depression_brier_and_calibration_oof(fold_results, "RandomForest")

    report = {
        "feature_stability": stab,
        "random_forest_oof_brier_calibration": brier_cal,
    }

    pf_json = os.path.join(save_dir, "per_fold_metrics.json")
    if os.path.isfile(pf_json):
        try:
            report["bootstrap_ci95_fold_mean"] = bootstrap_all_from_per_fold_json(
                pf_json, n_boot=5000, seed=random_state, ci=0.95
            )
        except Exception as e:
            report["bootstrap_ci_error"] = str(e)
    else:
        report["note_bootstrap"] = (
            "Run baselines with save_dir set to generate per_fold_metrics.json, "
            "then re-run extended_analysis or: python -m eldersense.extended_analysis --bootstrap-only"
        )

    if run_cutoff_sensitivity:
        report["gds_cutoff_sensitivity"] = compare_gds_cutoffs((5, 6), random_state=random_state)

    if run_qol_selection_compare:
        fr_qol = run_fold_pipeline(
            n_splits=5,
            random_state=random_state,
            verbose=False,
            feature_selection_target="qol",
        )
        qol_dep_df, _ = run_qol_baselines(fold_results, random_state=random_state, verbose=False)
        qol_sel_df, _ = run_qol_baselines(fr_qol, random_state=random_state, verbose=False)
        report["qol_r2_depression_driven_selection"] = qol_dep_df.set_index("model")["R2"].to_dict()
        report["qol_r2_qol_driven_selection"] = qol_sel_df.set_index("model")["R2"].to_dict()

    out_path = os.path.join(save_dir, "extended_analysis_report.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    if "bootstrap_ci95_fold_mean" in report:
        boot_path = os.path.join(save_dir, "bootstrap_ci95.json")
        with open(boot_path, "w", encoding="utf-8") as f:
            json.dump(report["bootstrap_ci95_fold_mean"], f, indent=2)
        print(f"Wrote {boot_path}")
    print(json.dumps(report, indent=2))
    print(f"\nWrote {out_path}")
    return report


if __name__ == "__main__":
    import argparse

    p = argparse.ArgumentParser()
    p.add_argument("--cutoff-sensitivity", action="store_true")
    p.add_argument("--compare-qol-selection", action="store_true")
    p.add_argument(
        "--bootstrap-only",
        action="store_true",
        help="Only read per_fold_metrics.json and write bootstrap_ci95.json",
    )
    args = p.parse_args()
    save_dir = os.path.join(PROJECT_ROOT, "eldersense", "data", "results")
    if args.bootstrap_only:
        pf = os.path.join(save_dir, "per_fold_metrics.json")
        if not os.path.isfile(pf):
            print("Missing", pf, "— run baselines first.")
            sys.exit(1)
        out = bootstrap_all_from_per_fold_json(pf)
        outp = os.path.join(save_dir, "bootstrap_ci95.json")
        with open(outp, "w", encoding="utf-8") as f:
            json.dump(out, f, indent=2)
        print("Wrote", outp)
        sys.exit(0)
    run_report(
        run_cutoff_sensitivity=args.cutoff_sensitivity,
        run_qol_selection_compare=args.compare_qol_selection,
    )
