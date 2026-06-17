from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.category import FareCategory, FareCategoryPrice
from app.models.transport import Line
from app.models.user import (
    User,
    UserCategoryRequest,
    UserCategoryRequestStatus,
)


def _default_category(db: Session) -> FareCategory | None:
    return db.scalar(select(FareCategory).where(FareCategory.is_default.is_(True)))


def effective_category_for(db: Session, user: User) -> FareCategory | None:
    
    if user.fare_category is None:
        return _default_category(db)

    cat = user.fare_category
    if not cat.requires_document:
        return cat

    approved = db.scalar(
        select(UserCategoryRequest).where(
            UserCategoryRequest.user_id == user.id,
            UserCategoryRequest.category_id == cat.id,
            UserCategoryRequest.status == UserCategoryRequestStatus.APPROVED,
        )
    )
    if approved is None:
        return _default_category(db)
    return cat


def price_cents_for(db: Session, line: Line, category: FareCategory | None) -> int:
    if category is None:
        return line.default_price_cents

    override = db.scalar(
        select(FareCategoryPrice).where(
            FareCategoryPrice.line_id == line.id,
            FareCategoryPrice.category_id == category.id,
        )
    )
    if override is None:
        return line.default_price_cents
    return override.price_cents