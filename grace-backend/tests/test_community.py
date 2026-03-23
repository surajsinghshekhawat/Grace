from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_elder_can_comment_on_post(client: AsyncClient, auth_headers: dict):
    topics = await client.get("/api/community/topics", headers=auth_headers)
    assert topics.status_code == 200
    topic_id = topics.json()[0]["id"]

    post = await client.post(
        f"/api/community/topics/{topic_id}/posts",
        headers=auth_headers,
        json={"body": "Community post for comments"},
    )
    assert post.status_code == 200
    post_id = post.json()["id"]

    comment = await client.post(
        f"/api/community/posts/{post_id}/comments",
        headers=auth_headers,
        json={"body": "This is a test comment", "parent_comment_id": None},
    )
    assert comment.status_code == 200
    data = comment.json()
    assert data["id"] == post_id
    assert data["comment_count"] >= 1
    assert len(data.get("comments", [])) >= 1
    assert data["comments"][0]["body"] == "This is a test comment"

