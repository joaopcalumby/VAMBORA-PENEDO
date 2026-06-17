from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import TokenPayload, get_db
from app.models.engagement import Reminder
from app.models.transport import Line, Stop
from app.schemas.engagement import ReminderCreate, ReminderResponse, ReminderUpdate

router = APIRouter(prefix="/lembretes", tags=["lembretes"])

DbDep = Annotated[Session, Depends(get_db)]


def _serialize(r: Reminder) -> ReminderResponse:
    return ReminderResponse(
        id=r.id,
        line_id=r.line_id,
        stop_id=r.stop_id,
        anticipation_minutes=r.anticipation_minutes,
        active=r.active,
        created_at=r.created_at,
    )


def _ensure_line_and_stop(db: Session, line_id: int, stop_id: int) -> None:
    if db.get(Line, line_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Linha não encontrada")
    if db.get(Stop, stop_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ponto não encontrado")


@router.get("", response_model=list[ReminderResponse])
def list_reminders(token: TokenPayload, db: DbDep) -> list[ReminderResponse]:
    user_id = int(token["sub"])
    reminders = db.scalars(
        select(Reminder)
        .where(Reminder.user_id == user_id)
        .order_by(Reminder.created_at.desc())
    ).all()
    return [_serialize(r) for r in reminders]


@router.post("", response_model=ReminderResponse, status_code=status.HTTP_201_CREATED)
def create_reminder(
    payload: ReminderCreate, token: TokenPayload, db: DbDep
) -> ReminderResponse:
    user_id = int(token["sub"])
    _ensure_line_and_stop(db, payload.line_id, payload.stop_id)

    reminder = Reminder(
        user_id=user_id,
        line_id=payload.line_id,
        stop_id=payload.stop_id,
        anticipation_minutes=payload.anticipation_minutes,
        active=True,
    )
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return _serialize(reminder)


@router.patch("/{reminder_id}", response_model=ReminderResponse)
def update_reminder(
    reminder_id: int,
    payload: ReminderUpdate,
    token: TokenPayload,
    db: DbDep,
) -> ReminderResponse:
    user_id = int(token["sub"])
    reminder = db.get(Reminder, reminder_id)
    if reminder is None or reminder.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lembrete não encontrado")

    reminder.active = payload.active
    db.commit()
    db.refresh(reminder)
    return _serialize(reminder)


@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
def delete_reminder(reminder_id: int, token: TokenPayload, db: DbDep) -> None:
    user_id = int(token["sub"])
    reminder = db.get(Reminder, reminder_id)
    if reminder is None or reminder.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lembrete não encontrado")
    db.delete(reminder)
    db.commit()
