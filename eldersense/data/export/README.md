# ElderSense export (required for `/api/predict`)

These files must exist on the server for assessments and predictions to work:

| File | Purpose |
|------|---------|
| `model_depression.joblib` | Depression model |
| `model_qol.joblib` | QoL model |
| `scaler.joblib` | Feature scaler |
| `impute_state.joblib` | Imputation state |
| `selected_features.json` | Feature list (required) |
| `columns_kept.json`, `feature_medians.json` | Optional extras |

## Generate locally (before deploy / commit)

From **repository root**:

```bash
cd eldersense
python -m eldersense.export_model
```

Requires the ElderSense Python env and training data per `eldersense/README.md`. After this, `*.joblib` files appear here — **commit them** if they are not too large for GitHub (typically fine; use Git LFS if a file exceeds ~50–100 MB).

If you cannot run the export, copy the five artifacts from a machine that already built them into this folder, then commit.
