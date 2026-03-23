from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.community import (
    CommunityComment,
    CommunityCommentLike,
    CommunityPost,
    CommunityPostLike,
    CommunityReport,
)
from app.models.user import User
from app.schemas.community import CommentCreate, CommentNode, CommunityReportCreate, PostCreate, PostPublic
from app.community_i18n import localize_topic
from app.security.deps import get_current_user


router = APIRouter(tags=["community"])


async def require_elder(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "elder":
        raise HTTPException(status_code=403, detail="Only elders can use the community")
    return current_user

TOPICS = [
    {"id": "health_tips", "title": "Health tips", "description": "Share and read health tips."},
    {"id": "daily_life", "title": "Daily life", "description": "Day-to-day experiences and support."},
    {"id": "mental_wellbeing", "title": "Mental wellbeing", "description": "Mental health and mood support."},
    {"id": "hobbies", "title": "Hobbies", "description": "Hobbies and activities."},
]
TOPIC_IDS = {t["id"] for t in TOPICS}
TOPIC_TITLE = {t["id"]: t["title"] for t in TOPICS}


async def _author_name(db: AsyncSession, user_id: int) -> str:
    res = await db.execute(select(User).where(User.id == user_id))
    u = res.scalar_one_or_none()
    return (u.name if u else "Member").strip() or "Member"


@router.get("/api/community/topics")
async def list_community_topics(
    lang: str | None = Query(None, description="Language: en, hi, ta"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_elder),
):
    out = []
    for t in TOPICS:
        post_count = await db.scalar(
            select(func.count()).select_from(CommunityPost).where(CommunityPost.topic_id == t["id"])
        )
        author_count = await db.scalar(
            select(func.count(func.distinct(CommunityPost.author_user_id))).where(CommunityPost.topic_id == t["id"])
        )
        base = {**t, "post_count": int(post_count or 0), "member_count": int(author_count or 0)}
        out.append(localize_topic(base, lang))
    return out


async def _post_to_public(
    db: AsyncSession,
    post: CommunityPost,
    viewer_id: int | None,
    include_comments: bool,
) -> PostPublic:
    like_count = await db.scalar(
        select(func.count()).select_from(CommunityPostLike).where(CommunityPostLike.post_id == post.id)
    )
    liked = False
    if viewer_id:
        lk = await db.execute(
            select(CommunityPostLike).where(
                CommunityPostLike.post_id == post.id, CommunityPostLike.user_id == viewer_id
            )
        )
        liked = lk.scalar_one_or_none() is not None
    c_count = await db.scalar(
        select(func.count()).select_from(CommunityComment).where(CommunityComment.post_id == post.id)
    )
    author_name = await _author_name(db, post.author_user_id)
    comments_nodes: list[CommentNode] = []
    if include_comments:
        res = await db.execute(
            select(CommunityComment).where(CommunityComment.post_id == post.id).order_by(CommunityComment.created_at)
        )
        rows = list(res.scalars().all())
        comment_likes: dict[int, int] = {}
        if rows:
            ids = [c.id for c in rows]
            lc = await db.execute(
                select(CommunityCommentLike.comment_id, func.count())
                .where(CommunityCommentLike.comment_id.in_(ids))
                .group_by(CommunityCommentLike.comment_id)
            )
            for cid, cnt in lc.all():
                comment_likes[int(cid)] = int(cnt)
        my_comment_likes: set[int] = set()
        if viewer_id and rows:
            lk2 = await db.execute(
                select(CommunityCommentLike.comment_id).where(
                    CommunityCommentLike.user_id == viewer_id,
                    CommunityCommentLike.comment_id.in_(ids),
                )
            )
            my_comment_likes = {int(x) for x in lk2.scalars().all()}

        by_id: dict[int, CommentNode] = {}
        for c in rows:
            by_id[c.id] = CommentNode(
                id=c.id,
                post_id=c.post_id,
                author_user_id=c.author_user_id,
                author_name=await _author_name(db, c.author_user_id),
                parent_comment_id=c.parent_comment_id,
                body=c.body,
                created_at=c.created_at,
                like_count=comment_likes.get(c.id, 0),
                liked_by_me=c.id in my_comment_likes,
                replies=[],
            )
        roots: list[CommentNode] = []
        for c in rows:
            node = by_id[c.id]
            if c.parent_comment_id and c.parent_comment_id in by_id:
                by_id[c.parent_comment_id].replies.append(node)
            else:
                roots.append(node)
        comments_nodes = roots

    return PostPublic(
        id=post.id,
        topic_id=post.topic_id,
        topic_title=TOPIC_TITLE.get(post.topic_id),
        author_user_id=post.author_user_id,
        author_name=author_name,
        body=post.body,
        created_at=post.created_at,
        like_count=int(like_count or 0),
        liked_by_me=liked,
        comment_count=int(c_count or 0),
        comments=comments_nodes,
    )


@router.get("/api/community/topics/{topic_id}/posts", response_model=list[PostPublic])
async def list_topic_posts(
    topic_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_elder),
):
    if topic_id not in TOPIC_IDS:
        raise HTTPException(status_code=404, detail="Unknown topic")
    res = await db.execute(
        select(CommunityPost)
        .where(CommunityPost.topic_id == topic_id)
        .order_by(CommunityPost.created_at.desc())
    )
    posts = list(res.scalars().all())
    return [await _post_to_public(db, p, current_user.id, include_comments=False) for p in posts]


@router.get("/api/community/feed", response_model=list[PostPublic])
async def community_feed(
    topic_id: str | None = None,
    limit: int = 80,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_elder),
):
    limit = max(1, min(100, limit))
    stmt = select(CommunityPost).order_by(CommunityPost.created_at.desc()).limit(limit)
    if topic_id:
        if topic_id not in TOPIC_IDS:
            raise HTTPException(status_code=404, detail="Unknown topic")
        stmt = (
            select(CommunityPost)
            .where(CommunityPost.topic_id == topic_id)
            .order_by(CommunityPost.created_at.desc())
            .limit(limit)
        )
    res = await db.execute(stmt)
    posts = list(res.scalars().all())
    return [await _post_to_public(db, p, current_user.id, include_comments=False) for p in posts]


@router.get("/api/community/posts/{post_id}", response_model=PostPublic)
async def get_post(
    post_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_elder),
):
    res = await db.execute(select(CommunityPost).where(CommunityPost.id == post_id))
    post = res.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return await _post_to_public(db, post, current_user.id, include_comments=True)


@router.post("/api/community/topics/{topic_id}/posts", response_model=PostPublic)
async def create_post(
    topic_id: str,
    body: PostCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_elder),
):
    if topic_id not in TOPIC_IDS:
        raise HTTPException(status_code=404, detail="Unknown topic")
    row = CommunityPost(topic_id=topic_id, author_user_id=current_user.id, body=body.body.strip())
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return await _post_to_public(db, row, current_user.id, include_comments=False)


@router.post("/api/community/posts/{post_id}/like")
async def toggle_post_like(
    post_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_elder),
):
    res = await db.execute(select(CommunityPost).where(CommunityPost.id == post_id))
    if not res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Post not found")
    existing = await db.execute(
        select(CommunityPostLike).where(
            CommunityPostLike.post_id == post_id, CommunityPostLike.user_id == current_user.id
        )
    )
    row = existing.scalar_one_or_none()
    if row:
        await db.execute(delete(CommunityPostLike).where(CommunityPostLike.id == row.id))
        await db.commit()
        liked = False
    else:
        db.add(CommunityPostLike(post_id=post_id, user_id=current_user.id))
        await db.commit()
        liked = True
    cnt = await db.scalar(select(func.count()).select_from(CommunityPostLike).where(CommunityPostLike.post_id == post_id))
    return {"liked": liked, "like_count": int(cnt or 0)}


@router.post("/api/community/posts/{post_id}/comments", response_model=PostPublic)
async def add_comment(
    post_id: int,
    body: CommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_elder),
):
    res = await db.execute(select(CommunityPost).where(CommunityPost.id == post_id))
    if not res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Post not found")
    if body.parent_comment_id is not None:
        pr = await db.execute(
            select(CommunityComment).where(
                CommunityComment.id == body.parent_comment_id,
                CommunityComment.post_id == post_id,
            )
        )
        if not pr.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Invalid parent comment")
    row = CommunityComment(
        post_id=post_id,
        author_user_id=current_user.id,
        parent_comment_id=body.parent_comment_id,
        body=body.body.strip(),
    )
    db.add(row)
    await db.commit()
    res2 = await db.execute(select(CommunityPost).where(CommunityPost.id == post_id))
    post = res2.scalar_one()
    return await _post_to_public(db, post, current_user.id, include_comments=True)


@router.post("/api/community/comments/{comment_id}/like")
async def toggle_comment_like(
    comment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_elder),
):
    res = await db.execute(select(CommunityComment).where(CommunityComment.id == comment_id))
    if not res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Comment not found")
    existing = await db.execute(
        select(CommunityCommentLike).where(
            CommunityCommentLike.comment_id == comment_id,
            CommunityCommentLike.user_id == current_user.id,
        )
    )
    row = existing.scalar_one_or_none()
    if row:
        await db.execute(delete(CommunityCommentLike).where(CommunityCommentLike.id == row.id))
        await db.commit()
        liked = False
    else:
        db.add(CommunityCommentLike(comment_id=comment_id, user_id=current_user.id))
        await db.commit()
        liked = True
    cnt = await db.scalar(
        select(func.count()).select_from(CommunityCommentLike).where(CommunityCommentLike.comment_id == comment_id)
    )
    return {"liked": liked, "like_count": int(cnt or 0)}


@router.post("/api/community/report")
async def report_post_or_comment(
    body: CommunityReportCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_elder),
):
    if body.target_type == "post":
        pr = await db.execute(select(CommunityPost).where(CommunityPost.id == body.target_id))
        if not pr.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Post not found")
    else:
        cr = await db.execute(select(CommunityComment).where(CommunityComment.id == body.target_id))
        if not cr.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Comment not found")

    db.add(
        CommunityReport(
            reporter_user_id=current_user.id,
            target_type=body.target_type,
            target_id=body.target_id,
            reason=body.reason.strip(),
            details=(body.details or "").strip() or None,
        )
    )
    await db.commit()
    return {"ok": True, "message": "Thank you — your report was received. Our team will review it."}
