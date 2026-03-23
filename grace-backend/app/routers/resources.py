from __future__ import annotations

from copy import deepcopy

from fastapi import APIRouter, HTTPException, Query

from app.i18n.resource_catalog_i18n import (
    localize_resource_item,
    localized_categories_for_lang,
    normalize_lang,
)
from app.routers.resources_catalog import CATALOG, CATEGORIES

router = APIRouter(tags=["resources"])


@router.get("/api/resources/categories")
async def list_categories(lang: str | None = Query(None, description="en | hi | ta")):
    code = normalize_lang(lang)
    if code == "en":
        return [{"name": c} for c in CATEGORIES]
    names = localized_categories_for_lang(code)
    return [{"name": n} for n in names]


def _items_for_list(lang: str) -> list[dict]:
    return [localize_resource_item(deepcopy(i), lang) for i in CATALOG]


@router.get("/api/resources")
async def list_resources(
    q: str | None = Query(None, description="Search title/summary/tags"),
    category: str | None = None,
    lang: str | None = Query(None, description="en | hi | ta — localized title/summary/category"),
):
    code = normalize_lang(lang)
    items = _items_for_list(code)
    if category:
        cat_lower = category.lower()
        items = [i for i in items if (i.get("category") or "").lower() == cat_lower]
    if q and q.strip():
        s = q.strip().lower()
        items = [
            i
            for i in items
            if s in (i.get("title") or "").lower()
            or s in (i.get("summary") or "").lower()
            or any(s in str(t).lower() for t in i.get("tags", []))
        ]
    return items


@router.get("/api/resources/{resource_id}")
async def get_resource(
    resource_id: str,
    lang: str | None = Query(None, description="en | hi | ta"),
):
    code = normalize_lang(lang)
    for i in CATALOG:
        if i["id"] == resource_id:
            return localize_resource_item(deepcopy(i), code)
    raise HTTPException(status_code=404, detail="Resource not found")
