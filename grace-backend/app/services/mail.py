from __future__ import annotations

import logging
import smtplib
from email.message import EmailMessage

from app import config

logger = logging.getLogger("grace")


def send_email(to_addr: str, subject: str, body_text: str) -> bool:
    """Send plain-text email. Returns False if SMTP not configured or send fails."""
    if not config.smtp_configured():
        logger.warning("email_skip: SMTP not configured (to=%s subject=%s)", to_addr, subject)
        return False
    try:
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = config.SMTP_FROM
        msg["To"] = to_addr
        msg.set_content(body_text)

        with smtplib.SMTP(config.SMTP_HOST, config.SMTP_PORT, timeout=30) as smtp:
            if config.SMTP_USE_TLS:
                smtp.starttls()
            if config.SMTP_USER:
                smtp.login(config.SMTP_USER, config.SMTP_PASSWORD)
            smtp.send_message(msg)
        return True
    except Exception:
        logger.exception("email_send_failed to=%s", to_addr)
        return False
