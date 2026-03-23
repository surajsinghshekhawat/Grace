"""
Generate publication-style figures from existing ElderSense artefacts (no SHAP recompute).

Outputs (default): docs/eldersense/figures/
  - shap_global_depression_top15.png
  - shap_global_qol_top15.png
  - shap_global_side_by_side.png
  - calibration_reliability_rf.png  (from extended_analysis_report.json bins)

Requires matplotlib.

Usage: python -m eldersense.plot_figures
"""
import json
import os
import sys

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import pandas as pd


def _fig_dir():
    return os.path.join(PROJECT_ROOT, "docs", "eldersense", "figures")


def plot_shap_bar(csv_path, title, out_path, top_n=15):
    import matplotlib.pyplot as plt

    df = pd.read_csv(csv_path).head(top_n)
    df = df.iloc[::-1]
    plt.figure(figsize=(7, 5))
    plt.barh(df["feature"].astype(str), df["mean_abs_shap"])
    plt.xlabel("Mean |SHAP|")
    plt.title(title)
    plt.tight_layout()
    plt.savefig(out_path, dpi=150)
    plt.close()


def plot_shap_side_by_side(dep_csv, qol_csv, out_path, top_n=15):
    import matplotlib.pyplot as plt

    d1 = pd.read_csv(dep_csv).head(top_n).iloc[::-1]
    d2 = pd.read_csv(qol_csv).head(top_n).iloc[::-1]
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(11, 6), sharey=False)
    ax1.barh(d1["feature"].astype(str), d1["mean_abs_shap"], color="#2c5aa0")
    ax1.set_title("Depression (XGBoost)")
    ax1.set_xlabel("Mean |SHAP|")
    ax2.barh(d2["feature"].astype(str), d2["mean_abs_shap"], color="#c44e52")
    ax2.set_title("QoL (XGBoost)")
    ax2.set_xlabel("Mean |SHAP|")
    fig.suptitle("Global feature importance (top 15)", fontsize=12)
    fig.tight_layout()
    fig.savefig(out_path, dpi=150)
    plt.close(fig)


def plot_calibration_from_report(report_json, out_path):
    import matplotlib.pyplot as plt

    with open(report_json, encoding="utf-8") as f:
        rep = json.load(f)
    cc = rep.get("random_forest_oof_brier_calibration", {}).get("calibration_curve")
    if not cc:
        return None
    x = cc["mean_predicted_value"]
    y = cc["fraction_of_positives"]
    plt.figure(figsize=(5, 5))
    plt.plot([0, 1], [0, 1], "k--", alpha=0.4, label="Perfect calibration")
    plt.plot(x, y, "o-", label="Random Forest (OOF)")
    plt.xlabel("Mean predicted probability")
    plt.ylabel("Fraction of positives")
    plt.title("Reliability diagram (10 bins)")
    plt.legend()
    plt.xlim(0, 1)
    plt.ylim(0, 1)
    plt.gca().set_aspect("equal", adjustable="box")
    plt.tight_layout()
    plt.savefig(out_path, dpi=150)
    plt.close()
    return out_path


def main():
    import shutil

    import matplotlib

    matplotlib.use("Agg")

    os.makedirs(_fig_dir(), exist_ok=True)
    res = os.path.join(PROJECT_ROOT, "eldersense", "data", "results")
    dep = os.path.join(res, "shap_importance_depression.csv")
    qol = os.path.join(res, "shap_importance_qol.csv")
    if os.path.isfile(dep):
        out = os.path.join(_fig_dir(), "shap_global_depression_top15.png")
        plot_shap_bar(dep, "Global SHAP — depression (top 15)", out)
        print("Wrote", out)
    else:
        print("Missing:", dep)
    if os.path.isfile(qol):
        out = os.path.join(_fig_dir(), "shap_global_qol_top15.png")
        plot_shap_bar(qol, "Global SHAP — QoL (top 15)", out)
        print("Wrote", out)
    else:
        print("Missing:", qol)
    if os.path.isfile(dep) and os.path.isfile(qol):
        out = os.path.join(_fig_dir(), "shap_global_side_by_side.png")
        plot_shap_side_by_side(dep, qol, out)
        print("Wrote", out)
    repj = os.path.join(res, "extended_analysis_report.json")
    if os.path.isfile(repj):
        p = plot_calibration_from_report(
            repj, os.path.join(_fig_dir(), "calibration_reliability_rf.png")
        )
        if p:
            print("Wrote", p)
    mtl_plot = os.path.join(
        res, "mtl_diagnostic_fold0", "mtl_loss_curves.png"
    )
    if os.path.isfile(mtl_plot):
        dst = os.path.join(_fig_dir(), "mtl_loss_curves_fold0.png")
        shutil.copyfile(mtl_plot, dst)
        print("Copied MTL diagnostic plot to", dst)
    print("Figures directory:", _fig_dir())


if __name__ == "__main__":
    main()
