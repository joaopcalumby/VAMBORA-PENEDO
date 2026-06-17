from enum import StrEnum
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.transport import Line, Stop
    from app.models.user import User


class FavoriteTargetType(StrEnum):
    LINE = "line"
    STOP = "stop"


class FeedbackType(StrEnum):
    PROBLEM = "problem"
    SUGGESTION = "suggestion"


class Favorite(Base, TimestampMixin):
    
    __tablename__ = "favorites"
    __table_args__ = (
        UniqueConstraint("user_id", "target_type", "target_id", name="uq_favorite_target"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    target_type: Mapped[FavoriteTargetType] = mapped_column(String(8), nullable=False)
    target_id: Mapped[int] = mapped_column(Integer, nullable=False)

    user: Mapped["User"] = relationship()


class Reminder(Base, TimestampMixin):
   
    __tablename__ = "reminders"

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    line_id: Mapped[int] = mapped_column(
        ForeignKey("lines.id", ondelete="CASCADE"),
        nullable=False,
    )
    stop_id: Mapped[int] = mapped_column(
        ForeignKey("stops.id", ondelete="CASCADE"),
        nullable=False,
    )

    anticipation_minutes: Mapped[int] = mapped_column(
        Integer,
        default=10,
        nullable=False,
        comment="Minutos de antecedência antes do horário oficial (5/10/15)",
    )

    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    user: Mapped["User"] = relationship()
    line: Mapped["Line"] = relationship()
    stop: Mapped["Stop"] = relationship()


class Feedback(Base, TimestampMixin):

    __tablename__ = "feedbacks"

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    type: Mapped[FeedbackType] = mapped_column(String(16), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)

    line_id: Mapped[Optional[int]] = mapped_column(ForeignKey("lines.id"), nullable=True)
    stop_id: Mapped[Optional[int]] = mapped_column(ForeignKey("stops.id"), nullable=True)

    user: Mapped["User"] = relationship()
    line: Mapped[Optional["Line"]] = relationship()
    stop: Mapped[Optional["Stop"]] = relationship()