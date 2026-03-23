# ElderSense ML pipeline

ElderSense predictive pipeline: load RV dataset, build depression and QoL targets, train baselines and multi-task model, evaluate, SHAP, export.

## Setup (from project root)

```bash
# Create and activate virtual environment
python -m venv eldersense/venv

# Windows
eldersense\venv\Scripts\activate

# macOS/Linux
source eldersense/venv/bin/activate

# Install dependencies (use numpy<2 for TensorFlow and SHAP; requirements.txt pins this)
pip install -r eldersense/requirements.txt
```

## Data

- **Raw dataset:** `data/raw/RV PhD Data Sheet 15.03.2022 (1).xlsx` (6 sheets, ~601 rows).
- **Merged output:** After first run of `load_data.py`, merged CSV is saved to `eldersense/data/merged.csv`.

## Run data loader

From **project root** (so that `data/raw/` and `eldersense/` paths resolve):

```bash
python eldersense/load_data.py
```

Or in Python:

```python
from eldersense.load_data import load_sheets, get_merged

sheets = load_sheets()   # dict of 6 dataframes
df = get_merged()        # single merged dataframe, prefixed columns
```

## How to run the pipeline

From **project root** (so paths to `data/raw/` and `eldersense/` resolve):

| Step | Command | Purpose |
|------|--------|--------|
| 1 | `python eldersense/load_data.py` | Merge 6 sheets → `eldersense/data/merged.csv` |
| 2 | `python eldersense/baselines.py` | Train LR, RF, XGB (dep + QoL), 5-fold CV → metrics tables |
| 3 | `python eldersense/mtl.py` | Train multi-task model, append MTL row to same tables |
| 4 | `python eldersense/explain.py` | SHAP (TreeExplainer) on XGBoost; global importance + local plots |
| 5 | `python eldersense/export_model.py` | Refit on 80% train, save models + feature list + preprocessing (run from project root with `python`, not by typing the path alone). |

Steps 2–4 use the same 5-fold pipeline; step 5 is a single 80/20 refit for export.

**If `explain.py` fails with `_ARRAY_API not found` or NumPy 2:** SHAP (and MTL) pull in OpenCV, which needs NumPy 1.x. Run `pip install "numpy<2"` and re-run.

## Outputs

| Location | Contents |
|----------|----------|
| `eldersense/data/merged.csv` | Merged dataset (601 × ~148). |
| `eldersense/data/results/depression_metrics.csv` | 5-fold metrics: LogisticRegression_L1, RandomForest, XGBoost, MTL. |
| `eldersense/data/results/qol_metrics.csv` | 5-fold metrics: ElasticNet, RandomForest, XGBoost, MTL. |
| `eldersense/data/results/shap_importance_depression.csv` | Global SHAP (mean abs SHAP) for depression. |
| `eldersense/data/results/shap_importance_qol.csv` | Global SHAP for QoL. |
| `eldersense/data/results/shap_shared_top15.csv` | Features in top-15 for both tasks. |
| `eldersense/data/results/shap_local_*.png` | Local explanation bar plots (2–3 participants per task). |
| `eldersense/data/export/` | Saved models (`model_depression.joblib`, `model_qol.joblib`), `scaler.joblib`, `impute_state.joblib`, `selected_features.json`, `README_export.txt`). |

## Implementation checklist

See [docs/eldersense/ELDERSENSE_IMPLEMENTATION_PLAN.md](../docs/eldersense/ELDERSENSE_IMPLEMENTATION_PLAN.md) for the full 40-step checklist.
