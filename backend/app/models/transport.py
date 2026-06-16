from datetime import time
from enum import StrEnum
from typing import TYPE_CHECKING

from sqlalchemy import Float, ForeignKey, Integer, String, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.category import FareCategoryPrice


class Modal(StrEnum):
    BUS = "bus"
    VAN = "van"
    FERRY = "ferry"


class DayType(StrEnum):
    WEEKDAY = "weekday"
    SATURDAY = "saturday"
    SUNDAY_HOLIDAY = "sunday_holiday"