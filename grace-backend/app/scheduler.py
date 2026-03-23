"""APScheduler: daily check-in reminder emails."""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select

from app import config
from app.db.session import SessionLocal
from app.models.user import User
from app.models.user_settings import UserSettings
from app.services.mail import send_email

logger = logging.getLogger("grace")

_scheduler: AsyncIOScheduler | None = None


async def _send_daily_reminders() -> None:
    if not config.smtp_configured():
        logger.info("reminder_job_skip: SMTP not configured")
        return
    async with SessionLocal() as db:
        res = await db.execute(select(UserSettings.user_id).where(UserSettings.checkin_reminders.is_(True)))
        uids = [row[0] for row in res.all()]
        if not uids:
            logger.info("reminder_job_no_recipients")
            return
        ures = await db.execute(select(User).where(User.id.in_(uids), User.role == "elder"))
        elders = list(ures.scalars().all())
        for u in elders:
            ident = u.email_or_phone.strip()
            if "@" not in ident:
                continue
            subj = "Grace — gentle reminder for your daily check-in"
            body = (
                f"Hi {u.name},\n\n"
                "This is a friendly reminder to take a moment for your daily wellbeing check-in in Grace.\n\n"
                "Open the app when it suits you — small steps still count.\n"
            )
            if send_email(ident, subj, body):
                logger.info("reminder_sent user_id=%s", u.id)
    logger.info("reminder_job_done at=%s", datetime.now(timezone.utc).isoformat())


def start_scheduler() -> AsyncIOScheduler:
    global _scheduler
    if _scheduler is not None:
        return _scheduler
    sch = AsyncIOScheduler(timezone="UTC")
    hour = max(0, min(23, config.REMINDER_HOUR_UTC))
    sch.add_job(
        _send_daily_reminders,
        "cron",
        hour=hour,
        minute=0,
        id="grace_checkin_reminders",
        replace_existing=True,
    )
    sch.start()
    _scheduler = sch
    logger.info("scheduler_started reminder_hour_utc=%s", hour)
    return sch


def shutdown_scheduler() -> None:
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None
        logger.info("scheduler_shutdown")
