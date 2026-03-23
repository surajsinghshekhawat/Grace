# Grace

Elder wellbeing: daily check-ins, ElderSense assessments, caregiver linking, medications, and community — **React (Vite) + FastAPI**.

---

## Repository layout

```
grace/                          ← run all Git commands from here
├── README.md                   ← this file
├── package.json                ← frontend deps & scripts
├── vite.config.ts
├── index.html
├── .env.example                ← copy to .env for local frontend (see below)
│
├── src/                        ← production React app
│   ├── main.jsx                ← entry (not src/main.tsx)
│   ├── App.jsx
│   ├── pages/                  ← route screens
│   ├── components/             ← shared UI + caregiver blocks
│   ├── lib/                    ← api, trends, wellbeing helpers
│   ├── i18n/
│   └── style.css
│
├── e2e/                        ← Playwright tests
├── public/                     ← static assets
├── scripts/                    ← optional Python utilities (see scripts/README.md)
│
├── grace-backend/              ← FastAPI API
│   ├── main.py
│   ├── app/                    ← routers, models, services
│   ├── alembic/                ← DB migrations
│   ├── requirements.txt
│   └── README.md               ← backend setup, ElderSense export
│
├── eldersense/                 ← ML training/export → joblib + JSON for API
│
└── archive/                    ← unused prototypes (not imported by build)
    └── figma-ui-prototype/
```

Internal docs, research datasets, and `docs/` are **gitignored** (see `.gitignore`).  

### Git

This repo lives in **`grace/`** only. **Do not** use a Git repo rooted at your user profile folder.

---

## Prerequisites

- **Node.js 20+** (for Vite 7)
- **Python 3.10+**
- **ElderSense model export** (required for predictions): from repo root, see `grace-backend/README.md` (`eldersense/data/export/` with `.joblib` + JSON).

---

## Local development

### 1. Backend

```bash
cd grace-backend
python -m venv .venv
# Windows: .venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Health check: `GET http://127.0.0.1:8000/health`

### 2. Frontend

From **project root** (`grace/`):

```bash
npm install
npm run dev
```

Opens Vite at `http://127.0.0.1:5173` with proxy to `/api` → backend (see `vite.config.ts`).

**Frontend env:** copy `.env.example` → `.env`. For local dev, leave `VITE_API_URL` empty so the proxy is used.

### 3. Tests (optional)

```bash
# backend
cd grace-backend && pytest

# frontend
npm test

# E2E (backend + dev server must be available)
npm run test:e2e
```

---

## Production deploy (free tier — step by step)

Use **HTTPS** everywhere. The browser sends cookies to your API; **do not** point the SPA at `http://` API in production.

### 0. Summary

| Piece | Role |
|--------|------|
| **Frontend** | Static files (HTML/JS/CSS) from `npm run build` → `dist/` |
| **Backend** | FastAPI on a host with a public URL |
| **Database** | Prefer **PostgreSQL** (Neon / Supabase / Render). SQLite on free PaaS disks is easy to lose. |

---

### Step 1 — Create a PostgreSQL database (recommended)

1. Create a free project on **Neon** or **Supabase** (or **Render PostgreSQL**).
2. Copy the **connection string** (SQLAlchemy/async URL).  
3. If the app still uses SQLite only, you must add Postgres support and migrate — **for a first deploy**, you can keep SQLite **only** if your host guarantees a **persistent disk** (many free tiers do not). Plan for Postgres before production users.

*(If you skip Postgres for now: deploy backend with persistent storage or accept data loss on restart.)*

---

### Step 2 — Deploy the API (example: Render)

1. Push this repo to **GitHub** (from `grace/` only).
2. On **Render** → **New** → **Web Service** → connect the repo.
3. **Root directory:** `grace-backend`
4. **Build command:** `pip install -r requirements.txt` (or use a `requirements.txt` + Python version from Render’s UI).
5. **Start command:**  
   `uvicorn main:app --host 0.0.0.0 --port $PORT`  
   (Render sets `$PORT`.)
6. **Environment variables** (minimum):

   | Variable | Example / note |
   |----------|----------------|
   | `GRACE_ENV` | `production` |
   | `GRACE_SECRET_KEY` | Long random string (openssl rand -hex 32) |
   | `CORS_ORIGINS` | `https://your-frontend.pages.dev` (comma-separated, no trailing slash) |
   | `GRACE_PUBLIC_APP_URL` | `https://your-frontend.pages.dev` (password reset links) |
   | `ELDERSENSE_EXPORT_DIR` | Path where joblib/JSON live on the server (or bake into image) |
   | `GRACE_DB_PATH` or DB URL | If you use Postgres, set whatever your app expects after you wire it |

7. Add **SMTP** vars if you use password reset email (`SMTP_HOST`, `SMTP_FROM`, etc.).
8. Deploy and note the **public API URL**, e.g. `https://grace-api.onrender.com`.

---

### Step 3 — Build the frontend with the real API URL

1. Locally (or in CI), from **repo root**:

   ```bash
   set VITE_API_URL=https://grace-api.onrender.com
   npm ci
   npm run build
   ```

   On Linux/macOS: `export VITE_API_URL=https://...`

2. **Upload the `dist/` folder** to a static host (next step).  
   - Cookies must be sent with `credentials: "include"` (already in app) **only** if your API sets `SameSite`/`Secure` correctly for your domain setup.

---

### Step 4 — Deploy static frontend (example: Cloudflare Pages)

1. **Cloudflare Dashboard** → **Workers & Pages** → **Create** → **Pages** → Connect GitHub.
2. **Project:** same repo; **root directory:** `/` (repo root).
3. **Build command:** `npm ci && npm run build`
4. **Build environment variable:** `VITE_API_URL` = `https://your-api.onrender.com` (no trailing slash).
5. **Output directory:** `dist`
6. After deploy, open the **Pages URL** and test login.

**CORS:** Your backend `CORS_ORIGINS` must include the exact **Pages** origin (e.g. `https://grace.pages.dev`).

---

### Step 5 — Align domains and cookies (important)

- **Same site:** Best UX is **frontend and API on subdomains** of one domain, e.g. `app.example.com` + `api.example.com`, with CORS and cookie `Domain` set carefully.
- **Cross-origin:** SPA on `pages.dev` and API on `onrender.com` is **cross-site**; cookies + CORS must be strict. Test login/logout and password reset.
- Set **`GRACE_PUBLIC_APP_URL`** to the **frontend** URL (for emails).

---

### Step 6 — Smoke test checklist

- [ ] `GET /health` on API returns OK  
- [ ] Register / login from deployed frontend  
- [ ] Cookie session works (no infinite 401)  
- [ ] Forgot password (if SMTP configured)  
- [ ] One elder flow + one caregiver flow  

---

## Troubleshooting

| Issue | What to check |
|--------|----------------|
| `CORS` errors in browser | `CORS_ORIGINS` includes exact frontend origin |
| API unreachable | Firewall, HTTPS, `$PORT` binding |
| Wrong API from frontend | Rebuild with correct `VITE_API_URL`; clear CDN cache |
| Blank page | Check browser console; wrong `base` in Vite if using subpath |

---

## License / attributions

See `ATTRIBUTIONS.md` where applicable.
