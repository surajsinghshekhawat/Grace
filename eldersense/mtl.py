"""
Phase 6: Multi-task model — shared representation, depression (sigmoid) + QoL (linear).
Steps 28–32: build model, combined loss, early stopping, train per fold, add to results.
"""
import numpy as np
import pandas as pd

try:
    from eldersense.baselines import (
        _depression_metrics,
        _qol_metrics,
        DEPRESSION_METRICS,
        QOL_METRICS,
    )
except ModuleNotFoundError:
    from baselines import (
        _depression_metrics,
        _qol_metrics,
        DEPRESSION_METRICS,
        QOL_METRICS,
    )

try:
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras import layers, Model
    HAS_TF = True
except ImportError:
    HAS_TF = False


def build_mtl_model(
    n_features,
    hidden=(64, 32),
    dropout=0.3,
    random_state=None,
    qol_loss_weight=8.0,
    qol_adapter_units=0,
):
    """
    Multi-task network: input -> Dense(64, ReLU) -> Dense(32, ReLU) -> Dropout(0.3)
    -> Branch1 (sigmoid) + optional QoL-specific Dense adapter -> Branch2 (linear QoL).
    Returns compiled Keras Model with two outputs: [depression_prob, qol_score].

    qol_loss_weight: weight for MSE(QoL) so the regression branch gets enough gradient (default 8).
    qol_adapter_units: if > 0, add a task-specific Dense layer before the QoL head (may reduce task conflict).
    """
    if not HAS_TF:
        raise ImportError("TensorFlow is required for MTL. Install with: pip install tensorflow")

    if random_state is not None:
        tf.keras.utils.set_random_seed(random_state)

    inp = keras.Input(shape=(n_features,), name="input")
    x = layers.Dense(hidden[0], activation="relu", name="shared_1")(inp)
    x = layers.Dense(hidden[1], activation="relu", name="shared_2")(x)
    x = layers.Dropout(dropout, name="dropout")(x)

    out_dep = layers.Dense(1, activation="sigmoid", name="depression")(x)
    qol_in = x
    if qol_adapter_units and int(qol_adapter_units) > 0:
        qol_in = layers.Dense(
            int(qol_adapter_units), activation="relu", name="qol_adapter"
        )(x)
    out_qol = layers.Dense(1, activation="linear", name="qol")(qol_in)

    model = Model(inp, [out_dep, out_qol], name="mtl")

    # Combined loss: alpha*BCE(depression) + beta*MSE(QoL). Higher beta helps QoL branch learn.
    alpha, beta = 1.0, float(qol_loss_weight)
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=1e-3),
        loss=["binary_crossentropy", "mse"],
        loss_weights=[alpha, beta],
        metrics={
            "depression": ["accuracy"],
            "qol": ["mae"],
        },
    )
    return model


def _to_array(X):
    """Ensure X is numpy for Keras."""
    if hasattr(X, "values"):
        return X.values.astype(np.float32)
    return np.asarray(X, dtype=np.float32)


def train_and_evaluate_fold(
    fold_result,
    epochs=200,
    validation_split=0.2,
    patience=15,
    batch_size=32,
    random_state=42,
    verbose=0,
    qol_loss_weight=8.0,
    qol_adapter_units=0,
    log_dir=None,
    return_history=False,
):
    """
    Train MTL on one fold; return depression and QoL metrics on test set.
    QoL target is **min–max normalised to [0, 1]** using **training-fold** min and max only;
    predictions are **inverse-transformed** to the original QoL scale **before** RMSE/R².
    With validation_split=0.2, **64%** of the full dataset is used as gradient updates per epoch
    (80% of the 80% training fold); 16% is early-stopping validation — document in the paper.

    qol_adapter_units: optional task-specific hidden units before the QoL head (see build_mtl_model).
    """
    if not HAS_TF:
        nan_dep = {k: np.nan for k in DEPRESSION_METRICS}
        nan_qol = {k: np.nan for k in QOL_METRICS}
        if return_history:
            return nan_dep, nan_qol, None
        return nan_dep, nan_qol

    X_tr = _to_array(fold_result["X_train_red"])
    X_te = _to_array(fold_result["X_test_red"])
    y_dep_tr = np.asarray(fold_result["y_dep_train"]).ravel().astype(np.float32)
    y_dep_te = np.asarray(fold_result["y_dep_test"]).ravel()
    y_qol_tr_raw = np.asarray(fold_result["y_qol_train"]).ravel().astype(np.float32)
    y_qol_te = np.asarray(fold_result["y_qol_test"]).ravel()

    # Min–max normalise QoL to [0,1] using train min/max so gradients are on a similar scale to BCE
    qol_min, qol_max = y_qol_tr_raw.min(), y_qol_tr_raw.max()
    if qol_max <= qol_min:
        qol_max = qol_min + 1.0
    y_qol_tr = ((y_qol_tr_raw - qol_min) / (qol_max - qol_min)).reshape(-1, 1)

    n_features = X_tr.shape[1]
    model = build_mtl_model(
        n_features,
        random_state=random_state,
        qol_loss_weight=qol_loss_weight,
        qol_adapter_units=qol_adapter_units,
    )

    early = keras.callbacks.EarlyStopping(
        monitor="val_loss",
        patience=patience,
        restore_best_weights=True,
        verbose=0,
    )
    callbacks = [early]
    if log_dir:
        import os

        os.makedirs(log_dir, exist_ok=True)
        callbacks.append(
            keras.callbacks.CSVLogger(
                os.path.join(log_dir, "mtl_training_log.csv"), append=False
            )
        )

    history = model.fit(
        X_tr,
        [y_dep_tr, y_qol_tr],
        validation_split=validation_split,
        epochs=epochs,
        batch_size=batch_size,
        callbacks=callbacks,
        verbose=verbose,
    )

    if log_dir and history is not None and hasattr(history, "history"):
        import json
        import os

        # Keras logs: loss, depression_loss, qol_loss, val_loss, val_depression_loss, val_qol_loss (names may vary by version)
        serialisable = {
            k: [float(x) for x in (v if isinstance(v, (list, tuple)) else list(v))]
            for k, v in history.history.items()
        }
        with open(os.path.join(log_dir, "mtl_history.json"), "w", encoding="utf-8") as f:
            json.dump(serialisable, f, indent=2)

    pred_dep_prob, pred_qol_norm = model.predict(X_te, verbose=0)
    pred_dep_prob = pred_dep_prob.ravel()
    # Unscale QoL back to original scale for metrics
    pred_qol = pred_qol_norm.ravel() * (qol_max - qol_min) + qol_min
    pred_dep_class = (pred_dep_prob >= 0.5).astype(int)

    dep_metrics = _depression_metrics(y_dep_te, pred_dep_class, pred_dep_prob)
    qol_metrics = _qol_metrics(y_qol_te, pred_qol)
    if return_history:
        return dep_metrics, qol_metrics, history
    return dep_metrics, qol_metrics


def run_mtl_baselines(fold_results, random_state=42, verbose=True, **train_kwargs):
    """
    Train MTL on each fold; aggregate depression and QoL metrics (mean ± SD).
    Returns (depression_df_row, qol_df_row) as single-row DataFrames for MTL,
    and all_folds list of (dep_metrics, qol_metrics) per fold.
    """
    if not HAS_TF:
        if verbose:
            print("Warning: TensorFlow not installed. Install with: pip install tensorflow")
        n = len(fold_results)
        dep_row = pd.DataFrame([{"model": "MTL", **{k: np.nan for k in DEPRESSION_METRICS}, **{f"{k}_std": 0 for k in DEPRESSION_METRICS}}])
        qol_row = pd.DataFrame([{"model": "MTL", **{k: np.nan for k in QOL_METRICS}, **{f"{k}_std": 0 for k in QOL_METRICS}}])
        return dep_row, qol_row, []

    all_dep = []
    all_qol = []
    kw = dict(train_kwargs)
    kw.pop("return_history", None)
    kw.pop("log_dir", None)
    for r in fold_results:
        dep_m, qol_m = train_and_evaluate_fold(
            r, random_state=random_state, verbose=0, **kw
        )
        all_dep.append(dep_m)
        all_qol.append(qol_m)

    # Aggregate: mean ± SD
    dep_row = {"model": "MTL"}
    for k in DEPRESSION_METRICS:
        vals = [all_dep[f][k] for f in range(len(all_dep))]
        vals = [v for v in vals if not (isinstance(v, float) and np.isnan(v))]
        dep_row[k] = np.mean(vals) if vals else np.nan
        dep_row[f"{k}_std"] = np.std(vals) if len(vals) > 1 else 0.0

    qol_row = {"model": "MTL"}
    for k in QOL_METRICS:
        vals = [all_qol[f][k] for f in range(len(all_qol))]
        vals = [v for v in vals if not (isinstance(v, float) and np.isnan(v))]
        qol_row[k] = np.mean(vals) if vals else np.nan
        qol_row[f"{k}_std"] = np.std(vals) if len(vals) > 1 else 0.0

    dep_df = pd.DataFrame([dep_row])
    qol_df = pd.DataFrame([qol_row])

    if verbose:
        print("=== MTL (mean ± SD over 5 folds) ===")
        print("Depression:", dep_df[DEPRESSION_METRICS].to_string(index=False))
        print("QoL:", qol_df[QOL_METRICS].to_string(index=False))

    return dep_df, qol_df, list(zip(all_dep, all_qol))


def add_mtl_to_results_tables(dep_path, qol_path, fold_results, save_dir=None, **train_kwargs):
    """
    Run MTL, append MTL row to existing depression and QoL result tables, and optionally save.
    dep_path, qol_path: paths to existing CSV tables (e.g. from Phase 5).
    If save_dir is set, writes updated depression_metrics.csv and qol_metrics.csv there.
    If TensorFlow is not installed, returns original tables unchanged (no NaN row added).
    """
    dep_df = pd.read_csv(dep_path)
    qol_df = pd.read_csv(qol_path)
    # Remove any existing MTL row so we don't duplicate
    dep_df = dep_df.loc[dep_df["model"] != "MTL"].reset_index(drop=True)
    qol_df = qol_df.loc[qol_df["model"] != "MTL"].reset_index(drop=True)

    mtl_dep, mtl_qol, _ = run_mtl_baselines(fold_results, verbose=True, **train_kwargs)

    if not HAS_TF:
        print("Skipping MTL row (TensorFlow not installed). Original tables unchanged.")
        return dep_df, qol_df

    dep_combined = pd.concat([dep_df, mtl_dep], ignore_index=True)
    qol_combined = pd.concat([qol_df, mtl_qol], ignore_index=True)

    if save_dir:
        import os
        os.makedirs(save_dir, exist_ok=True)
        dep_combined.to_csv(os.path.join(save_dir, "depression_metrics.csv"), index=False)
        qol_combined.to_csv(os.path.join(save_dir, "qol_metrics.csv"), index=False)
        print(f"Saved tables with MTL to {save_dir}")

    return dep_combined, qol_combined


if __name__ == "__main__":
    import os
    try:
        from eldersense.fold_pipeline import run_fold_pipeline
    except ModuleNotFoundError:
        from fold_pipeline import run_fold_pipeline

    PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    results_dir = os.path.join(PROJECT_ROOT, "eldersense", "data", "results")
    dep_path = os.path.join(results_dir, "depression_metrics.csv")
    qol_path = os.path.join(results_dir, "qol_metrics.csv")

    if not os.path.isfile(dep_path) or not os.path.isfile(qol_path):
        print("Run Phase 5 baselines first to create depression_metrics.csv and qol_metrics.csv")
    else:
        fold_results = run_fold_pipeline(n_splits=5, random_state=42, verbose=True)
        add_mtl_to_results_tables(dep_path, qol_path, fold_results, save_dir=results_dir)
        print("Phase 6 MTL complete.")
