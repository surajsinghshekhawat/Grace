"""
Grace backend: prediction API (ElderSense), health check, auth, DB.
"""
import logging
import os
import time
import traceback
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from sqlalchemy import text

from app.db.init_db import init_db
from app.db.session import SessionLocal, engine
from app.limiter import limiter
from app.predict import get_assets, predict
from app.routers.auth import router as auth_router
from app.routers.assessments import router as assessments_router
from app.routers.caregiver import router as caregiver_router
from app.routers.caregiver_alerts import router as caregiver_alerts_router
from app.routers.checkins import router as checkins_router
from app.routers.linking import router as linking_router
from app.routers.me import router as me_router
from app.routers.data_export import router as data_export_router
from app.routers.community import router as community_router
from app.routers.moderation import router as moderation_router
from app.routers.elder_health import router as elder_health_router
from app.routers.resources import router as resources_router
from app.routers.wellbeing_insights import router as wellbeing_insights_router
from app.scheduler import shutdown_scheduler, start_scheduler

logger = logging.getLogger("grace")


def _configure_logging() -> None:
    level = os.environ.get("LOG_LEVEL", "INFO").upper()
    logging.basicConfig(
        level=getattr(logging, level, logging.INFO),
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )


def _is_production() -> bool:
    return os.environ.get("GRACE_ENV", "").lower() == "production"


def _public_predict_allowed() -> bool:
    """Direct POST /api/predict is for dev/tools; disabled in production unless explicitly allowed."""
    if os.environ.get("GRACE_ALLOW_PUBLIC_PREDICT", "").lower() in ("1", "true", "yes"):
        return True
    if _is_production():
        return False
    return True


class PredictRequest(BaseModel):
    answers: dict


class PredictResponse(BaseModel):
    depression_risk: str
    depression_probability: float
    qol_score: float
    qol_score_0_100: float
    top_factors: list[dict]
    disclaimer: str


@asynccontextmanager
async def lifespan(app: FastAPI):
    _configure_logging()
    try:
        get_assets()
        logger.info("ElderSense export loaded")
    except FileNotFoundError as e:
        logger.warning("ElderSense export missing: %s — POST /api/predict may return 503", e)

    await init_db(engine)
    start_scheduler()
    yield
    shutdown_scheduler()


app = FastAPI(title="Grace API", version="0.1.0", lifespan=lifespan)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

_default_origins = (
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174"
)
_cors_origins = [o.strip() for o in os.environ.get("CORS_ORIGINS", _default_origins).split(",") if o.strip()]
_origin_regex = None if _is_production() else r"^https?://(localhost|127\.0\.0\.1):517\d$"

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_origin_regex=_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(assessments_router)
app.include_router(caregiver_router)
app.include_router(caregiver_alerts_router)
app.include_router(checkins_router)
app.include_router(linking_router)
app.include_router(me_router)
app.include_router(data_export_router)
app.include_router(community_router)
app.include_router(moderation_router)
app.include_router(elder_health_router)
app.include_router(resources_router)
app.include_router(wellbeing_insights_router)


@app.middleware("http")
async def request_timing_middleware(request: Request, call_next):
    start = time.perf_counter()
    try:
        response = await call_next(request)
        ms = (time.perf_counter() - start) * 1000
        logger.info(
            "request method=%s path=%s status=%s ms=%.2f",
            request.method,
            request.url.path,
            getattr(response, "status_code", "?"),
            ms,
        )
        return response
    except Exception:
        ms = (time.perf_counter() - start) * 1000
        logger.exception("request_failed method=%s path=%s ms=%.2f", request.method, request.url.path, ms)
        raise


@app.get("/health")
async def health():
    models_loaded = False
    try:
        get_assets()
        models_loaded = True
    except Exception:
        pass

    db_ok = False
    try:
        async with SessionLocal() as session:
            await session.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        logger.exception("health_db_check_failed")

    status = "ok" if db_ok else "degraded"
    return {"status": status, "database": db_ok, "models_loaded": models_loaded}


@app.post("/api/predict", response_model=PredictResponse)
def api_predict(req: PredictRequest):
    """Run ElderSense prediction from Grace questionnaire answers (dev/tools; gated in production)."""
    if not _public_predict_allowed():
        raise HTTPException(status_code=404, detail="Not found")
    try:
        get_assets()
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=f"Models not loaded: {e}") from e
    if not req.answers:
        raise HTTPException(status_code=400, detail="answers required")
    try:
        result = predict(req.answers)
        return PredictResponse(**result)
    except Exception as e:
        logger.error("predict_error %s", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e)) from e


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
