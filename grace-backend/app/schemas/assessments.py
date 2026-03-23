from datetime import datetime
from typing import TYPE_CHECKING, Literal

from pydantic import BaseModel, Field

if TYPE_CHECKING:
    from app.models.assessment import Assessment


class SurveyMeta(BaseModel):
    """Sent by the client so we know weekly vs full flow (optional)."""

    mode: Literal["full", "weekly"] | None = None
    questions_in_flow: int | None = Field(None, ge=1, le=120)


class AssessmentCreate(BaseModel):
    answers: dict = Field(min_length=1)
    survey_meta: SurveyMeta | None = None


class AssessmentPublic(BaseModel):
    id: int
    elder_user_id: int
    created_by_user_id: int
    created_at: datetime

    depression_risk: str
    depression_probability: float
    qol_score: float
    qol_score_0_100: float
    top_factors: list[dict]

    answered_question_count: int = 0
    assessment_flow: Literal["weekly", "full"] = "full"
    assessment_confidence_hint: str = ""

    class Config:
        from_attributes = True


def assessment_row_to_public(row: "Assessment", survey_meta: SurveyMeta | None = None) -> AssessmentPublic:
    """Build public DTO with confidence copy for weekly vs full."""
    n = len(row.answers or {})
    if survey_meta and survey_meta.mode:
        flow: Literal["weekly", "full"] = survey_meta.mode
    else:
        flow = "weekly" if n <= 52 else "full"
    if flow == "weekly":
        hint = (
            f"This screening used {n} answers from the shorter weekly check-in. "
            "The model fills other areas with typical values — a full assessment gives a steadier picture when you can."
        )
    else:
        hint = f"This screening used {n} answers from the fuller questionnaire."
    base = AssessmentPublic.model_validate(row)
    return base.model_copy(update={"answered_question_count": n, "assessment_flow": flow, "assessment_confidence_hint": hint})

