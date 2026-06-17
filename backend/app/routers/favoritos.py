from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.deps import TokenPayload, get_db
from app.models.engagement import Favorite, FavoriteTargetType
from app.models.transport import Line, Stop
from app.schemas.engagement import FavoriteCreate, FavoriteResponse

router = APIRouter(prefix="/favoritos", tags=["favoritos"])

DbDep = Annotated[Session, Depends(get_db)]


def _serialize(fav: Favorite) -> FavoriteResponse:
    target_type = (
        fav.target_type.value if hasattr(fav.target_type, "value") else str(fav.target_type)
    )
    return FavoriteResponse(
        id=fav.id,
        target_type=target_type,
        target_id=fav.target_id,
        created_at=fav.created_at,
    )


def _ensure_target_exists(db: Session, target_type: str, target_id: int) -> None:
    model = Line if target_type == "line" else Stop
    if db.get(model, target_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{target_type.capitalize()} {target_id} não existe",
        )


@router.get("", response_model=list[FavoriteResponse])
def list_favorites(token: TokenPayload, db: DbDep) -> list[FavoriteResponse]:
    user_id = int(token["sub"])
    favorites = db.scalars(
        select(Favorite).where(Favorite.user_id == user_id).order_by(Favorite.created_at.desc())
    ).all()
    return [_serialize(f) for f in favorites]


@router.post("", response_model=FavoriteResponse, status_code=status.HTTP_201_CREATED)
def create_favorite(
    payload: FavoriteCreate, token: TokenPayload, db: DbDep
) -> FavoriteResponse:
    user_id = int(token["sub"])
    _ensure_target_exists(db, payload.target_type, payload.target_id)

    favorite = Favorite(
        user_id=user_id,
        target_type=FavoriteTargetType(payload.target_type),
        target_id=payload.target_id,
    )
    db.add(favorite)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        existing = db.scalar(
            select(Favorite).where(
                Favorite.user_id == user_id,
                Favorite.target_type == FavoriteTargetType(payload.target_type),
                Favorite.target_id == payload.target_id,
            )
        )
        if existing is None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Favorito duplicado",
            )
        return _serialize(existing)

    db.refresh(favorite)
    return _serialize(favorite)


@router.delete("/{favorite_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
def delete_favorite(favorite_id: int, token: TokenPayload, db: DbDep) -> None:
    user_id = int(token["sub"])
    favorite = db.get(Favorite, favorite_id)
    if favorite is None or favorite.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Favorito não encontrado")
    db.delete(favorite)
    db.commit()