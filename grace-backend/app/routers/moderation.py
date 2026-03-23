from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.community import CommunityComment, CommunityPost, CommunityReport
from app.models.user import User
from app.schemas.community import CommunityReportListItem, CommunityReportStatusPatch
from app.security.deps import require_moderator


router = APIRouter(tags=["moderation"])

_PREVIEW_LEN = 280


async def _reporter_name(db: AsyncSession, user_id: int) -> str:
    res = await db.execute(select(User).where(User.id == user_id))
    u = res.scalar_one_or_none()
    return (u.name if u else "Unknown").strip() or "Unknown"


async def _report_to_item(db: AsyncSession, r: CommunityReport) -> CommunityReportListItem:
    preview = ""
    target_post_id = r.target_id
    if r.target_type == "post":
        pr = await db.execute(select(CommunityPost).where(CommunityPost.id == r.target_id))
        post = pr.scalar_one_or_none()
        preview = (post.body if post else "[deleted or missing post]")[:_PREVIEW_LEN]
    else:
        cr = await db.execute(select(CommunityComment).where(CommunityComment.id == r.target_id))
        comment = cr.scalar_one_or_none()
        if comment:
            target_post_id = comment.post_id
            preview = comment.body[:_PREVIEW_LEN]
        else:
            preview = "[deleted or missing comment]"
            target_post_id = 0

    return CommunityReportListItem(
        id=r.id,
        reporter_user_id=r.reporter_user_id,
        reporter_name=await _reporter_name(db, r.reporter_user_id),
        target_type=r.target_type,  # type: ignore[arg-type]
        target_id=r.target_id,
        target_post_id=target_post_id,
        target_preview=preview,
        reason=r.reason,
        details=r.details,
        status=r.status,
        created_at=r.created_at,
    )


@router.get("/api/moderator/community-reports", response_model=list[CommunityReportListItem])
async def list_community_reports(
    status: str | None = Query(None, description="Filter: pending, reviewed, dismissed, or omit for all"),
    limit: int = Query(100, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_moderator),
):
    stmt = select(CommunityReport)
    if status and status != "all":
        if status not in ("pending", "reviewed", "dismissed"):
            raise HTTPException(status_code=400, detail="status must be pending, reviewed, dismissed, or all")
        stmt = stmt.where(CommunityReport.status == status)
    stmt = stmt.order_by(CommunityReport.created_at.desc()).limit(limit)
    res = await db.execute(stmt)
    rows = list(res.scalars().all())
    out: list[CommunityReportListItem] = []
    for r in rows:
        out.append(await _report_to_item(db, r))
    return out


@router.patch("/api/moderator/community-reports/{report_id}", response_model=CommunityReportListItem)
async def patch_community_report(
    report_id: int,
    body: CommunityReportStatusPatch,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_moderator),
):
    res = await db.execute(select(CommunityReport).where(CommunityReport.id == report_id))
    r = res.scalar_one_or_none()
    if r is None:
        raise HTTPException(status_code=404, detail="Report not found")
    r.status = body.status
    await db.commit()
    await db.refresh(r)
    return await _report_to_item(db, r)
