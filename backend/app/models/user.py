from datetime import date, datetime
from enum import StrEnum
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Date, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.category import FareCategory
    from app.models.wallet import Wallet


class UserRole(StrEnum):
    USER = "user"
    DRIVER = "driver"
    ADMIN = "admin"


class DriverStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class UserCategoryRequestStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    cpf: Mapped[Optional[str]] = mapped_column(String(14), unique=True, index=True, nullable=True)
    birth_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

   
    password_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    role: Mapped[UserRole] = mapped_column(
        String(16),
        default=UserRole.USER,
        nullable=False,
    )

    google_id: Mapped[Optional[str]] = mapped_column(
        String(64),
        unique=True,
        index=True,
        nullable=True,
    )

    fare_category_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("fare_categories.id"),
        nullable=True,
    )

    driver: Mapped[Optional["Driver"]] = relationship(
        back_populates="user",
        uselist=False,
        foreign_keys="Driver.user_id",
    )
    wallet: Mapped[Optional["Wallet"]] = relationship(back_populates="user", uselist=False)
    fare_category: Mapped[Optional["FareCategory"]] = relationship(
        foreign_keys=[fare_category_id],
    )
    category_requests: Mapped[list["UserCategoryRequest"]] = relationship(
        back_populates="user",
        foreign_keys="UserCategoryRequest.user_id",
    )


class Driver(Base, TimestampMixin):
    __tablename__ = "drivers"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )

    professional_id: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        nullable=False,
        comment="Número identificador profissional informado pelo motorista",
    )

    status: Mapped[DriverStatus] = mapped_column(
        String(16),
        default=DriverStatus.PENDING,
        nullable=False,
    )

    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    approved_by_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
    )
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    user: Mapped["User"] = relationship(
        back_populates="driver",
        foreign_keys=[user_id],
    )
    approved_by: Mapped[Optional["User"]] = relationship(foreign_keys=[approved_by_id])


class UserCategoryRequest(Base, TimestampMixin):
    __tablename__ = "user_category_requests"

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    category_id: Mapped[int] = mapped_column(
        ForeignKey("fare_categories.id"),
        nullable=False,
    )

    status: Mapped[UserCategoryRequestStatus] = mapped_column(
        String(16),
        default=UserCategoryRequestStatus.PENDING,
        nullable=False,
    )

    document_path: Mapped[Optional[str]] = mapped_column(
        String(512),
        nullable=True,
        comment="Caminho relativo do arquivo de documento comprobatório",
    )
    justification: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="Justificativa do reviewer (obrigatória em rejeição)",
    )

    reviewed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    reviewed_by_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
    )

    user: Mapped["User"] = relationship(
        back_populates="category_requests",
        foreign_keys=[user_id],
    )
    category: Mapped["FareCategory"] = relationship()
    reviewed_by: Mapped[Optional["User"]] = relationship(foreign_keys=[reviewed_by_id])