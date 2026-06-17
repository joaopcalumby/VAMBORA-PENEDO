"""Schemas Pydantic dos endpoints de transporte (linhas, horários, pontos, rotas)."""
from __future__ import annotations

from datetime import date, time
from typing import Optional

from pydantic import BaseModel


class LineSummary(BaseModel):
    id: int
    number: str
    name: str
    modal: str
    default_price_cents: int


class LineDetail(LineSummary):
    pass


class ScheduleEntry(BaseModel):
    time: time


class SchedulesByDay(BaseModel):
    """Horários agrupados por tipo de dia (PRD §RF1.2)."""

    weekday: list[time]
    saturday: list[time]
    sunday_holiday: list[time]


class NextDepartureResponse(BaseModel):
    departure_time: time
    target_date: date
    minutes_until: int
    same_day: bool


class StopSummary(BaseModel):
    id: int
    name: str
    latitude: float
    longitude: float
    modal: str


class LineAtStop(BaseModel):
    """Linha que passa num ponto, com seu próximo horário."""

    id: int
    number: str
    name: str
    modal: str
    next_departure: Optional[NextDepartureResponse] = None


class StopDetail(StopSummary):
    lines: list[LineAtStop]


class RoutePointResponse(BaseModel):
    sequence: int
    latitude: float
    longitude: float


class RouteResponse(BaseModel):
    id: int
    line_id: int
    points: list[RoutePointResponse]
