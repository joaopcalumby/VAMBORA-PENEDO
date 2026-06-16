from typing import TYPE_CHECKING, Optional

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class AuditLog(Base, TimestampMixin):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True)

    admin_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )
    target_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    field: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        comment="Nome do campo alterado (ex.: 'phone', 'name', 'email')",
    )
    old_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    new_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    justification: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Justificativa textual obrigatória (RNF7.1)",
    )

    admin: Mapped["User"] = relationship(foreign_keys=[admin_user_id])
    target: Mapped["User"] = relationship(foreign_keys=[target_user_id])