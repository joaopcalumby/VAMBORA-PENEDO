from datetime import time
from enum import StrEnum
from typing import TYPE_CHECKING

from sqlalchemy import Column, Float, ForeignKey, Integer, String, Table, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.category import FareCategoryPrice


# Tabela de associação M:N entre Stop e Line.
# Permite responder "quais linhas passam neste ponto" (PRD §RF2.5 —
# Detalhe do Ponto) sem inferir por proximidade geográfica.
stop_lines = Table(
    "stop_lines",
    Base.metadata,
    Column(
        "stop_id",
        ForeignKey("stops.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "line_id",
        ForeignKey("lines.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class Modal(StrEnum):
    BUS = "bus"
    VAN = "van"
    FERRY = "ferry"


class DayType(StrEnum):
    WEEKDAY = "weekday"
    SATURDAY = "saturday"
    SUNDAY_HOLIDAY = "sunday_holiday"


class Line(Base, TimestampMixin):
    __tablename__ = "lines"

    id: Mapped[int] = mapped_column(primary_key=True)

    number: Mapped[str] = mapped_column(
        String(16),
        index=True,
        nullable=False,
        comment="Número/código público da linha (ex.: '01', 'C1', 'BAL')",
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    modal: Mapped[Modal] = mapped_column(String(16), nullable=False)

    default_price_cents: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        comment="Preço padrão da linha em centavos (categoria padrão)",
    )

    schedules: Mapped[list["Schedule"]] = relationship(
        back_populates="line",
        cascade="all, delete-orphan",
    )
    routes: Mapped[list["Route"]] = relationship(
        back_populates="line",
        cascade="all, delete-orphan",
    )
    category_prices: Mapped[list["FareCategoryPrice"]] = relationship(
        cascade="all, delete-orphan",
        overlaps="line",
    )
    stops: Mapped[list["Stop"]] = relationship(
        secondary=stop_lines,
        back_populates="lines",
    )


class Stop(Base, TimestampMixin):
    __tablename__ = "stops"

    id: Mapped[int] = mapped_column(primary_key=True)

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)

    modal: Mapped[Modal] = mapped_column(
        String(16),
        nullable=False,
        comment="Modal predominante atendido pelo ponto",
    )

    lines: Mapped[list["Line"]] = relationship(
        secondary=stop_lines,
        back_populates="stops",
    )


class Route(Base, TimestampMixin):
    __tablename__ = "routes"

    id: Mapped[int] = mapped_column(primary_key=True)

    line_id: Mapped[int] = mapped_column(
        ForeignKey("lines.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    line: Mapped["Line"] = relationship(back_populates="routes")
    points: Mapped[list["RoutePoint"]] = relationship(
        back_populates="route",
        cascade="all, delete-orphan",
        order_by="RoutePoint.sequence",
    )


class RoutePoint(Base):
    # Ponto numa polyline da rota (sequência ordenada de lat/lng).
    # NÃO confundir com Stop: Route é o desenho do traçado, Stop é onde
    # o veículo para. Em geral RoutePoints >> Stops em quantidade.

    __tablename__ = "route_points"

    id: Mapped[int] = mapped_column(primary_key=True)

    route_id: Mapped[int] = mapped_column(
        ForeignKey("routes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    sequence: Mapped[int] = mapped_column(Integer, nullable=False)

    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)

    route: Mapped["Route"] = relationship(back_populates="points")


class Schedule(Base):
    # Horário tabelado oficial de partida de uma linha em um tipo de dia.

    __tablename__ = "schedules"

    id: Mapped[int] = mapped_column(primary_key=True)

    line_id: Mapped[int] = mapped_column(
        ForeignKey("lines.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    day_type: Mapped[DayType] = mapped_column(String(16), nullable=False, index=True)
    departure_time: Mapped[time] = mapped_column(Time, nullable=False)

    line: Mapped["Line"] = relationship(back_populates="schedules")
