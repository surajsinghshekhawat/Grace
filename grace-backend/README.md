# Grace Backend

FastAPI server for Grace: ElderSense prediction API and (later) auth, profiles, check-ins.

## Prerequisites

- Python 3.10+
- ElderSense export: run from project root:
  ```bash
  cd eldersense && python -m eldersense.export_model
  ```
  This creates `eldersense/data/export/` with `model_depression.joblib`, `model_qol.joblib`, `scaler.joblib`, `impute_state.joblib`, `selected_features.json` (and optionally `columns_kept.json`, `feature_medians.json`).

## Setup

```bash
cd grace-backend
python -m venv venv
# Windows: venv\Scripts\activate
# Unix: source venv/bin/activate
pip install -r requirements.txt
```

## Database migrations (Alembic)

Schema changes are applied with **Alembic** (sync SQLite URL points at the same file as the app: `GRACE_DB_PATH` / default `grace-backend/grace.db`).

```bash
cd grace-backend
# after pulling changes that include new revisions:
alembic upgrade head
```

- **Existing DB** from before `users.is_moderator`: run `alembic upgrade head` once (adds the column if missing).
- **Fresh DB**: starting the app still runs `create_all` (creates tables). If you run `alembic upgrade head` on an empty file first, it no-ops until `users` exists; then either start the app or run `alembic upgrade head` again after tables exist—or use `alembic stamp 20250306_01` if `create_all` already created the column.

New revisions live under `alembic/versions/`.

## Run

From `grace-backend/`:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Or from project root:

```bash
cd grace-backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Endpoints

- `GET /health` – `status` (`ok` / `degraded`), `database`, `models_loaded`.
- `GET /api/resources` – optional query **`lang=en|hi|ta`** for localized title/summary/category (default English).
- `GET /api/resources/categories` – optional **`lang`** for matching category labels.
- `POST /api/predict` – dev/tools only in many deployments; body `{ "answers": { … } }`. **Disabled when `GRACE_ENV=production`** unless `GRACE_ALLOW_PUBLIC_PREDICT=1`. Normal app flow uses authenticated assessment routes.

## Tests

```bash
pytest tests -q
```

Uses `tests/pytest_grace.db` (see `tests/conftest.py`). See also `docs/project/TEST_NOTES.md`.

## Environment

- `ELDERSENSE_EXPORT_DIR` – path to eldersense data/export (default: `../eldersense/data/export` from repo root).
- `CORS_ORIGINS` – comma-separated origins (default includes `http://localhost:5173`). With **`GRACE_ENV=production`**, localhost origin regex is off — set explicit origins only.
- `GRACE_ENV` – set to `production` for stricter CORS and to gate `/api/predict`.
- `GRACE_ALLOW_PUBLIC_PREDICT` – `1` / `true` to allow `POST /api/predict` in production (usually leave unset).
- `GRACE_SECRET_KEY` – JWT signing secret (required strong value in production).
- `GRACE_DB_PATH` – SQLite file path (default `grace-backend/grace.db`).
- `LOG_LEVEL` – e.g. `INFO`, `DEBUG`.
- `GRACE_MODERATOR_IDS` – optional comma-separated **user IDs** allowed to moderate (same as **`users.is_moderator = true`** for API access). You can set the flag in the DB (`UPDATE users SET is_moderator = 1 WHERE id = …`) **or** use this env list. Example: `GRACE_MODERATOR_IDS=1,2`.
- **Data export** – `GET /api/me/data-export` (elder) and `GET /api/me/caregiver-data-export` (caregiver): JSON portability bundles (see OpenAPI / app routers).

Security overview: `docs/SECURITY.md` (repo root).
