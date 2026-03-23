from sqlalchemy.ext.asyncio import AsyncEngine

from app.db.base import Base


async def init_db(engine: AsyncEngine) -> None:
    # Import models so metadata is populated
    from app.models import assessment  # noqa: F401
    from app.models import caregiver_alert  # noqa: F401
    from app.models import caregiver_elder_link  # noqa: F401
    from app.models import community  # noqa: F401
    from app.models import daily_check_in  # noqa: F401
    from app.models import elder_medication  # noqa: F401
    from app.models import elder_profile  # noqa: F401
    from app.models import elder_invite  # noqa: F401
    from app.models import emergency_contact  # noqa: F401
    from app.models import sos_log  # noqa: F401
    from app.models import password_reset  # noqa: F401
    from app.models import user  # noqa: F401
    from app.models import user_settings  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

