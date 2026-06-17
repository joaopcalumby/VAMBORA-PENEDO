"""
Cálculo do próximo horário de partida de uma linha.

Determina, a partir do momento atual no fuso de Penedo–AL (America/Maceio),
qual o próximo horário tabelado da linha — considerando o tipo de dia
(útil, sábado, domingo/feriado) e fazendo "rollover" para o dia seguinte
quando todos os horários do dia já passaram.

Esta lógica vive em services/ porque é reusada pelo router de linhas,
pelo router de pontos (para listar "linhas que passam aqui") e poderá
ser reutilizada no futuro pelo agendamento de lembretes (RF4.3).
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from typing import Iterable
from zoneinfo import ZoneInfo

from app.models.transport import DayType, Schedule

# Penedo–AL. Brasil já não usa horário de verão, mas ZoneInfo cuida se mudar.
PENEDO_TZ = ZoneInfo("America/Maceio")


@dataclass(frozen=True)
class NextSchedule:
    departure_time: time
    target_date: date
    minutes_until: int
    same_day: bool


def _day_type_for(d: date) -> DayType:
    # Sem suporte a feriados no MVP — domingo cai em SUNDAY_HOLIDAY,
    # sábado em SATURDAY, e o restante em WEEKDAY.
    weekday = d.weekday()  # 0=segunda ... 6=domingo
    if weekday == 5:
        return DayType.SATURDAY
    if weekday == 6:
        return DayType.SUNDAY_HOLIDAY
    return DayType.WEEKDAY


def _filter_for_day(schedules: Iterable[Schedule], day_type: DayType) -> list[time]:
    return sorted(s.departure_time for s in schedules if s.day_type == day_type)


def find_next(
    schedules: Iterable[Schedule],
    *,
    now: datetime | None = None,
) -> NextSchedule | None:
    """
    Retorna o próximo horário a partir de `now` (default: agora em Maceió).

    None se a linha não opera hoje e nem amanhã (caso patológico — sem
    horários cadastrados ou somente dias específicos sem cobertura).
    """
    schedules = list(schedules)
    if not schedules:
        return None

    if now is None:
        now = datetime.now(PENEDO_TZ)
    elif now.tzinfo is None:
        now = now.replace(tzinfo=PENEDO_TZ)
    else:
        now = now.astimezone(PENEDO_TZ)

    today = now.date()
    current_time = now.time()

    # 1) Tenta achar o próximo horário ainda HOJE.
    today_times = _filter_for_day(schedules, _day_type_for(today))
    for t in today_times:
        if t >= current_time:
            target = datetime.combine(today, t, tzinfo=PENEDO_TZ)
            minutes = int((target - now).total_seconds() // 60)
            return NextSchedule(t, today, minutes, same_day=True)

    # 2) Caso contrário, varre os próximos 7 dias procurando algum horário.
    for delta in range(1, 8):
        candidate = today + timedelta(days=delta)
        times_for_day = _filter_for_day(schedules, _day_type_for(candidate))
        if not times_for_day:
            continue
        first = times_for_day[0]
        target = datetime.combine(candidate, first, tzinfo=PENEDO_TZ)
        minutes = int((target - now).total_seconds() // 60)
        return NextSchedule(first, candidate, minutes, same_day=False)

    return None
