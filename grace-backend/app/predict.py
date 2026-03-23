"""
Load ElderSense export and run prediction from Grace answers.
Build row from columns_kept + medians, overwrite with grace_mapping; scale; subset to selected_features; predict.
"""
import json
import os
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd

from app.answer_wellbeing import blended_qol_0_100
from app.grace_mapping import grace_answers_to_feature_dict
from app.recommendations import build_recommendations


def _export_dir() -> Path:
    base = Path(__file__).resolve().parent.parent.parent  # grace repo root
    return Path(os.environ.get("ELDERSENSE_EXPORT_DIR", base / "eldersense" / "data" / "export"))


def _load_assets():
    export = _export_dir()
    if not export.exists():
        raise FileNotFoundError(f"Export dir not found: {export}")

    model_dep = joblib.load(export / "model_depression.joblib")
    model_qol = joblib.load(export / "model_qol.joblib")
    scaler = joblib.load(export / "scaler.joblib")
    impute_state = joblib.load(export / "impute_state.joblib")
    with open(export / "selected_features.json") as f:
        selected = json.load(f)

    imp, cols_dropped, columns_kept = impute_state
    medians = {c: float(imp.statistics_[i]) for i, c in enumerate(columns_kept)}

    return {
        "model_dep": model_dep,
        "model_qol": model_qol,
        "scaler": scaler,
        "columns_kept": columns_kept,
        "feature_medians": medians,
        "selected_features": selected,
    }


_assets: dict[str, Any] | None = None


def get_assets():
    global _assets
    if _assets is None:
        _assets = _load_assets()
    return _assets


def predict(answers: dict) -> dict:
    """
    answers: Grace questionnaire answers { question_id: value }.
    Returns: depression_risk, depression_probability, qol_score, qol_score_0_100, top_factors, disclaimer.
    """
    ast = get_assets()
    columns_kept = ast["columns_kept"]
    medians = ast["feature_medians"]
    selected = ast["selected_features"]
    scaler = ast["scaler"]
    model_dep = ast["model_dep"]
    model_qol = ast["model_qol"]

    # Build one row: default medians, overwrite with Grace-mapped values
    mapped = grace_answers_to_feature_dict(answers, selected)
    row = pd.DataFrame([medians])
    for k, v in mapped.items():
        if k in row.columns:
            row[k] = v

    # Scale and subset
    X_sc = scaler.transform(row)
    X_sc = pd.DataFrame(X_sc, columns=columns_kept)
    X_red = X_sc[selected]

    prob = float(model_dep.predict_proba(X_red)[0, 1])
    depression_risk = "elevated" if prob >= 0.5 else "low"

    qol_raw = float(model_qol.predict(X_red)[0])
    # Blend ML QoL (scale can differ by training target) with self-reported Likert/smiley answers
    blended_qol, _model_component, _n_self = blended_qol_0_100(qol_raw, answers or {})
    qol_score_0_100 = round(blended_qol, 1)

    top_factors_raw = build_recommendations(answers or {}, prob, qol_score_0_100, max_items=10)
    top_factors = [
        {
            "name": r["name"],
            "effect": r["effect"],
            "resource_slug": r.get("resource_slug", "learning_growth"),
        }
        for r in top_factors_raw
    ]

    return {
        "depression_risk": depression_risk,
        "depression_probability": round(prob, 4),
        "qol_score": round(qol_raw, 4),
        "qol_score_0_100": qol_score_0_100,
        "top_factors": top_factors,
        "disclaimer": "This is not a clinical diagnosis. If you have concerns, please consult a healthcare provider.",
    }
