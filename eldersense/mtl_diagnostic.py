"""
Train MTL on a single CV fold with full History + CSV log for reviewer-facing diagnostics.

Writes:
  mtl_training_log.csv   — per-epoch metrics (Keras CSVLogger)
  mtl_history.json       — serialised history.history
  mtl_loss_curves.png    — train vs val total loss + per-output losses (if matplotlib available)

Usage (from project root):
  python -m eldersense.mtl_diagnostic --fold 0 --out-dir eldersense/data/results/mtl_diagnostic_fold0
"""
import argparse
import os
import sys

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)


def plot_history(history_path, out_png):
    import json
    import matplotlib.pyplot as plt

    with open(history_path, encoding="utf-8") as f:
        h = json.load(f)

    epochs = range(1, len(h.get("loss", [])) + 1)
    fig, axes = plt.subplots(2, 1, figsize=(8, 7), sharex=True)

    # Total loss
    ax = axes[0]
    if "loss" in h:
        ax.plot(epochs, h["loss"], label="train loss")
    if "val_loss" in h:
        ax.plot(epochs, h["val_loss"], label="val loss")
    ax.set_ylabel("Total loss")
    ax.legend()
    ax.set_title("MTL: total loss (early stopping on val_loss)")

    # Per-output losses (Keras 2/3 naming)
    ax = axes[1]
    for key, lab in (
        ("depression_loss", "train BCE (depression)"),
        ("val_depression_loss", "val BCE (depression)"),
        ("qol_loss", "train MSE (QoL, scaled)"),
        ("val_qol_loss", "val MSE (QoL, scaled)"),
    ):
        if key in h and len(h[key]) == len(list(epochs)):
            ax.plot(epochs, h[key], label=lab)
    ax.set_xlabel("Epoch")
    ax.set_ylabel("Per-output loss")
    ax.legend(loc="best", fontsize=8)
    ax.set_title("MTL: branch losses (QoL in normalised target space)")

    fig.tight_layout()
    fig.savefig(out_png, dpi=150)
    plt.close(fig)
    return out_png


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--fold", type=int, default=0, help="0-based CV fold index")
    p.add_argument(
        "--out-dir",
        type=str,
        default=None,
        help="Output directory for logs and plot",
    )
    p.add_argument("--no-plot", action="store_true")
    args = p.parse_args()

    out_dir = args.out_dir or os.path.join(
        PROJECT_ROOT, "eldersense", "data", "results", f"mtl_diagnostic_fold{args.fold}"
    )
    os.makedirs(out_dir, exist_ok=True)

    try:
        from eldersense.fold_pipeline import run_fold_pipeline
        from eldersense.mtl import train_and_evaluate_fold, HAS_TF
    except ModuleNotFoundError:
        from fold_pipeline import run_fold_pipeline
        from mtl import train_and_evaluate_fold, HAS_TF

    if not HAS_TF:
        print("TensorFlow not installed; cannot run MTL diagnostic.")
        sys.exit(1)

    fold_results = run_fold_pipeline(n_splits=5, random_state=42, verbose=False)
    if args.fold < 0 or args.fold >= len(fold_results):
        print(f"Invalid fold {args.fold}; need 0..{len(fold_results)-1}")
        sys.exit(1)
    r = fold_results[args.fold]

    dep_m, qol_m, history = train_and_evaluate_fold(
        r,
        random_state=42,
        verbose=1,
        log_dir=out_dir,
        return_history=True,
    )
    print("Test metrics (this fold):", dep_m, qol_m)
    hist_json = os.path.join(out_dir, "mtl_history.json")
    if not args.no_plot and os.path.isfile(hist_json):
        try:
            png = os.path.join(out_dir, "mtl_loss_curves.png")
            plot_history(hist_json, png)
            print(f"Saved plot: {png}")
        except Exception as e:
            print("Plot skipped:", e)

    print(f"Done. Artifacts in: {out_dir}")


if __name__ == "__main__":
    main()
