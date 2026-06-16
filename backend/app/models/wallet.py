from datetime import datetime
from enum import StrEnum
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.transport import Line
    from app.models.user import User


class TransactionType(StrEnum):
    RECHARGE = "recharge"
    PAYMENT = "payment"


class Wallet(Base, TimestampMixin):
    __tablename__ = "wallets"

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )

    balance_cents: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    user: Mapped["User"] = relationship(back_populates="wallet")
    transactions: Mapped[list["Transaction"]] = relationship(
        back_populates="wallet",
        cascade="all, delete-orphan",
        order_by="Transaction.created_at.desc()",
    )


class Transaction(Base, TimestampMixin):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True)

    wallet_id: Mapped[int] = mapped_column(
        ForeignKey("wallets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    type: Mapped[TransactionType] = mapped_column(String(16), nullable=False, index=True)
    amount_cents: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        comment="Positivo para crédito (recharge), negativo para débito (payment)",
    )

    line_id: Mapped[Optional[int]] = mapped_column(ForeignKey("lines.id"), nullable=True)
    driver_user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    qrcode_id: Mapped[Optional[int]] = mapped_column(ForeignKey("qr_codes.id"), nullable=True)

    wallet: Mapped["Wallet"] = relationship(back_populates="transactions")
    line: Mapped[Optional["Line"]] = relationship()
    driver: Mapped[Optional["User"]] = relationship(foreign_keys=[driver_user_id])


class QRCode(Base, TimestampMixin):

    __tablename__ = "qr_codes"

    id: Mapped[int] = mapped_column(primary_key=True)

    code: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True,
        nullable=False,
        comment="Token único codificado no QR (UUID4 sem hífens)",
    )

    driver_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    line_id: Mapped[int] = mapped_column(
        ForeignKey("lines.id"),
        nullable=False,
        index=True,
    )

    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    driver: Mapped["User"] = relationship(foreign_keys=[driver_user_id])
    line: Mapped["Line"] = relationship()