"""
Router /linhas: listagem, busca, detalhe, horários e rota.

Endpoints aqui são públicos (não exigem JWT) — atendem o usuário
mesmo antes do login, conforme PRD §RF1 (consulta de linhas é
funcionalidade base do app).
"""
from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.core.deps import get_db
from app.models.transport import Line, Route, Schedule
from app.schemas.transport import (
    LineDetail,
    LineSummary,
    NextDepartureResponse,
    RoutePointResponse,
    RouteResponse,
    SchedulesByDay,
)
from app.services.proximo_horario import find_next

router = APIRouter(prefix="/linhas", tags=["linhas"])

DbDep = Annotated[Session, Depends(get_db)]


def _serialize_line(line: Line) -> LineSummary:
    modal = line.modal.value if hasattr(line.modal, "value") else str(line.modal)
    return LineSummary(
        id=line.id,
        number=line.number,
        name=line.name,
        modal=modal,
        default_price_cents=line.default_price_cents,
    )


@router.get("", response_model=list[LineSummary])
def list_lines(
    db: DbDep,
    q: Optional[str] = Query(
        default=None,
        description="Busca por número, nome ou destino/trajeto (case-insensitive)",
    ),
) -> list[LineSummary]:
    stmt = select(Line)
    if q:
        pattern = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(Line.number.ilike(pattern), Line.name.ilike(pattern))
        )
    stmt = stmt.order_by(Line.number.asc())
    return [_serialize_line(line) for line in db.scalars(stmt).all()]


@router.get("/{line_id}", response_model=LineDetail)
def get_line(line_id: int, db: DbDep) -> LineDetail:
    line = db.get(Line, line_id)
    if line is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Linha não encontrada")
    return _serialize_line(line)


@router.get("/{line_id}/horarios", response_model=SchedulesByDay)
def list_schedules(line_id: int, db: DbDep) -> SchedulesByDay:
    line = db.get(Line, line_id)
    if line is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Linha não encontrada")

    schedules = db.scalars(
        select(Schedule).where(Schedule.line_id == line_id)
    ).all()

    grouped = SchedulesByDay(weekday=[], saturday=[], sunday_holiday=[])
    for s in schedules:
        key = s.day_type.value if hasattr(s.day_type, "value") else s.day_type
        if key == "weekday":
            grouped.weekday.append(s.departure_time)
        elif key == "saturday":
            grouped.saturday.append(s.departure_time)
        elif key == "sunday_holiday":
            grouped.sunday_holiday.append(s.departure_time)

    grouped.weekday.sort()
    grouped.saturday.sort()
    grouped.sunday_holiday.sort()
    return grouped


@router.get("/{line_id}/proximo", response_model=Optional[NextDepartureResponse])
def get_next_departure(line_id: int, db: DbDep) -> Optional[NextDepartureResponse]:
    """
    Calcula o próximo horário da linha a partir do agora em America/Maceio.

    Retorna 204 No Content (via None) se a linha não opera nos próximos
    7 dias — caso patológico, mas mantém a UI graciosa.
    """
    line = db.get(Line, line_id)
    if line is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Linha não encontrada")

    schedules = db.scalars(select(Schedule).where(Schedule.line_id == line_id)).all()
    nxt = find_next(schedules)
    if nxt is None:
        return None
    return NextDepartureResponse(
        departure_time=nxt.departure_time,
        target_date=nxt.target_date,
        minutes_until=nxt.minutes_until,
        same_day=nxt.same_day,
    )


@router.get("/{line_id}/rota", response_model=RouteResponse)
def get_route(line_id: int, db: DbDep) -> RouteResponse:
    line = db.get(Line, line_id)
    if line is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Linha não encontrada")

    route = db.scalar(
        select(Route)
        .where(Route.line_id == line_id)
        .options(selectinload(Route.points))
    )
    if route is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rota não cadastrada para esta linha",
        )

    return RouteResponse(
        id=route.id,
        line_id=route.line_id,
        points=[
            RoutePointResponse(
                sequence=p.sequence,
                latitude=p.latitude,
                longitude=p.longitude,
            )
            for p in route.points
        ],
    )
