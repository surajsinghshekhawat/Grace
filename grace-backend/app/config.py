import os
from pathlib import Path

# Grace repo root (parent of grace-backend)
BASE_DIR = Path(__file__).resolve().parent.parent.parent
EXPORT_DIR = Path(os.environ.get("ELDERSENSE_EXPORT_DIR", str(BASE_DIR / "eldersense" / "data" / "export")))
DB_PATH = Path(os.environ.get("GRACE_DB_PATH", str(BASE_DIR / "grace-backend" / "grace.db")))
SECRET_KEY = os.environ.get("GRACE_SECRET_KEY", "change-me-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

ACCESS_TOKEN_COOKIE_NAME = os.environ.get("GRACE_ACCESS_COOKIE_NAME", "grace_access_token")

# Password reset & email
PUBLIC_APP_URL = os.environ.get("GRACE_PUBLIC_APP_URL", "http://127.0.0.1:5173").rstrip("/")
SUPPORT_EMAIL = os.environ.get("GRACE_SUPPORT_EMAIL", "").strip()

SMTP_HOST = os.environ.get("SMTP_HOST", "").strip()
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "").strip()
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "").strip()
SMTP_FROM = os.environ.get("SMTP_FROM", "").strip()
SMTP_USE_TLS = os.environ.get("SMTP_USE_TLS", "1").lower() in ("1", "true", "yes")

# Daily check-in reminder (UTC hour)
REMINDER_HOUR_UTC = int(os.environ.get("GRACE_REMINDER_HOUR_UTC", "9"))

# Redis for SlowAPI (optional)
REDIS_URL = os.environ.get("REDIS_URL", "").strip()


def is_production() -> bool:
    return os.environ.get("GRACE_ENV", "").lower() == "production"


def smtp_configured() -> bool:
    return bool(SMTP_HOST and SMTP_FROM)
