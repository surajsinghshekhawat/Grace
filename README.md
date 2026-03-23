# Grace

Web app for elder wellbeing check-ins, assessments (ElderSense), caregiver linking, and community — React (Vite) + FastAPI.

### Git repository location

This project has its **own** Git repo in this folder (`grace/.git`). Always run `git status`, `git add`, and `git commit` from **`c:\Users\Suraj\Downloads\grace`** (or your clone path).

If you previously ran `git init` in your user profile by mistake, you may have a `.git` in your home folder that tracks the entire profile — that is **not** this project. Rename that folder to `.git.bak` (after closing tools that use Git) if you only need the repo inside `grace`.

## Quick start (local)

**Backend**

```bash
cd grace-backend
python -m venv .venv
# Windows: .venv\Scripts\activate
pip install -r requirements.txt
# ElderSense models: from repo root, see grace-backend/README.md
alembic upgrade head
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

**Frontend**

```bash
npm install
npm run dev
```

Use `.env.example` (root) and configure the API URL for production builds (`VITE_API_URL`).

## Repo contents

Application code lives under `src/`, `grace-backend/`, and `eldersense/` (ML export). Internal documentation and research datasets are listed in `.gitignore` and are not tracked.

## Deployment

See the deployment section in your team notes or follow a **free-tier** layout:

| Layer | Typical free option |
|--------|---------------------|
| Frontend static site | **Cloudflare Pages**, **Netlify**, or **Vercel** |
| API (Python) | **Render** Web Service, **Railway**, or **Fly.io** |
| Database | **Neon**, **Supabase**, or **Render PostgreSQL** (SQLite on free PaaS is fragile — use Postgres for anything public) |

Set `GRACE_ENV=production`, `GRACE_SECRET_KEY`, `CORS_ORIGINS`, `GRACE_PUBLIC_APP_URL`, and database URL. Build the frontend with `VITE_API_URL=https://your-api.example.com` so the browser calls the deployed API.
