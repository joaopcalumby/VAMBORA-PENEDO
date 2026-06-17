from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import TokenPayload, get_db
from app.models.engagement import Feedback, FeedbackType
from app.models.transport import Line, Stop
from app.schemas.engagement import FeedbackCreate, FeedbackResponse

router = APIRouter(prefix="/feedback", tags=["feedback"])

DbDep = Annotated[Session, Depends(get_db)]


@router.post("", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
def create_feedback(
    payload: FeedbackCreate, token: TokenPayload, db: DbDep
) -> FeedbackResponse:
    user_id = int(token["sub"])

    if payload.line_id is not None and db.get(Line, payload.line_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Linha não encontrada")
    if payload.stop_id is not None and db.get(Stop, payload.stop_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ponto não encontrado")

    feedback = Feedback(
        user_id=user_id,
        type=FeedbackType(payload.type),
        message=payload.message.strip(),
        line_id=payload.line_id,
        stop_id=payload.stop_id,
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)

    return FeedbackResponse(
        id=feedback.id,
        type=feedback.type.value if hasattr(feedback.type, "value") else str(feedback.type),
        message=feedback.message,
        line_id=feedback.line_id,
        stop_id=feedback.stop_id,
        created_at=feedback.created_at,
    )