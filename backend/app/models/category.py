from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.transport import Line


class FareCategory(Base, TimestampMixin):
    __tablename__ = "fare_categories"

    id: Mapped[int] = mapped_column(primary_key=True)

    slug: Mapped[str] = mapped_column(
        String(32),
        unique=True,
        index=True,
        nullable=False,
        comment="Identificador estável (padrao, estudante, idoso, sindicato...)",
    )
    name: Mapped[str] = mapped_column(String(64), nullable=False)

    requires_document: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        comment="Se True, exige UserCategoryRequest com documento aprovado",
    )

    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


class FareCategoryPrice(Base):

    __tablename__ = "fare_category_prices"
    __table_args__ = (
        UniqueConstraint("line_id", "category_id", name="uq_line_category"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    line_id: Mapped[int] = mapped_column(
        ForeignKey("lines.id", ondelete="CASCADE"),
        nullable=False,
    )
    category_id: Mapped[int] = mapped_column(
        ForeignKey("fare_categories.id", ondelete="CASCADE"),
        nullable=False,
    )

    price_cents: Mapped[int] = mapped_column(Integer, nullable=False)

    line: Mapped["Line"] = relationship()
    category: Mapped["FareCategory"] = relationship()