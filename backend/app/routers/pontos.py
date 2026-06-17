"""
Router /pontos: listagem dos pontos de parada e detalhe.

O detalhe (GET /pontos/{id}) inclui a lista de linhas que passam ali —
atende o painel "Detalhe do Ponto" do mapa (PRD §RF2.5).
"""
from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.deps import get_db
from app.models.transport import Line, Schedule, Stop
from app.schemas.transport import (
    LineAtStop,
    NextDepartureResponse,
    StopDetail,
    StopSummary,
)
from app.services.proximo_horario import find_next

router = APIRouter(prefix="/pontos", tags=["pontos"])

DbDep = Annotated[Session, Depends(get_db)]


def _serialize_stop(stop: Stop) -> StopSummary:
    modal = stop.modal.value if hasattr(stop.modal, "value") else str(stop.modal)
    return StopSummary(
        id=stop.id,
        name=stop.name,
        latitude=stop.latitude,
        longitude=stop.longitude,
        modal=modal,
    )


@router.get("", response_model=list[StopSummary])
def list_stops(
    db: DbDep,
    line_id: Optional[int] = Query(default=None, description="Filtra pontos por linha"),
) -> list[StopSummary]:
    stmt = select(Stop)
    if line_id is not None:
        stmt = stmt.join(Stop.lines).where(Line.id == line_id)
    stmt = stmt.order_by(Stop.name.asc())
    return [_serialize_stop(s) for s in db.scalars(stmt).unique().all()]


@router.get("/{stop_id}", response_model=StopDetail)
def get_stop(stop_id: int, db: DbDep) -> StopDetail:
    stop = db.scalar(
        select(Stop).where(Stop.id == stop_id).options(selectinload(Stop.lines))
    )
    if stop is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ponto não encontrado")

    lines_at_stop: list[LineAtStop] = []
    for line in stop.lines:
        schedules = db.scalars(select(Schedule).where(Schedule.line_id == line.id)).all()
        nxt = find_next(schedules)
        next_dep = (
            NextDepartureResponse(
                departure_time=nxt.departure_time,
                target_date=nxt.target_date,
                minutes_until=nxt.minutes_until,
                same_day=nxt.same_day,
            )
            if nxt
            else None
        )
        modal = line.modal.value if hasattr(line.modal, "value") else str(line.modal)
        lines_at_stop.append(
            LineAtStop(
                id=line.id,
                number=line.number,
                name=line.name,
                modal=modal,
                next_departure=next_dep,
            )
        )

    return StopDetail(
        **_serialize_stop(stop).model_dump(),
        lines=lines_at_stop,
    )
