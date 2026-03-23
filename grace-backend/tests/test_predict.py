from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_predict_requires_answers(client: AsyncClient):
    r = await client.post("/api/predict", json={"answers": {}})
    assert r.status_code == 400


@pytest.mark.asyncio
async def test_predict_with_sample_answers_or_skip(client: AsyncClient):
    """Integration: needs ElderSense export; otherwise 503."""
    r = await client.post(
        "/api/predict",
        json={"answers": {"q_mood": 3, "q_energy": 3}},
    )
    assert r.status_code in (200, 503)
    if r.status_code == 200:
        data = r.json()
        assert data["depression_risk"] in ("low", "elevated")
        assert "depression_probability" in data
        assert "qol_score_0_100" in data
        assert isinstance(data.get("top_factors"), list)
