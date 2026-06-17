from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import TokenPayload, get_db
from app.core.security import hash_password, verify_password
from app.models.user import User
from app.models.wallet import Transaction, Wallet
from app.schemas.perfil import (
    GenericOk,
    UpdatePasswordRequest,
    UpdatePhoneRequest,
)
from app.schemas.wallet import TransactionResponse

router = APIRouter(prefix="/perfil", tags=["perfil"])

DbDep = Annotated[Session, Depends(get_db)]


def _load_user(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")
    return user


@router.patch("/telefone", response_model=GenericOk)
def update_phone(payload: UpdatePhoneRequest, token: TokenPayload, db: DbDep) -> GenericOk:
    user = _load_user(db, int(token["sub"]))
    user.phone = payload.phone.strip()
    db.commit()
    return GenericOk()


@router.patch("/senha", response_model=GenericOk)
def update_password(
    payload: UpdatePasswordRequest, token: TokenPayload, db: DbDep
) -> GenericOk:
    user = _load_user(db, int(token["sub"]))

    if user.password_hash is None or not verify_password(
        payload.current_password, user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Senha atual incorreta.",
        )

    user.password_hash = hash_password(payload.new_password)
    db.commit()
    return GenericOk()


@router.get("/atividade", response_model=list[TransactionResponse])
def list_activity(token: TokenPayload, db: DbDep) -> list[TransactionResponse]:
    user_id = int(token["sub"])
    wallet = db.scalar(select(Wallet).where(Wallet.user_id == user_id))
    if wallet is None:
        return []

    txs = db.scalars(
        select(Transaction)
        .where(Transaction.wallet_id == wallet.id)
        .order_by(Transaction.created_at.desc())
    ).all()

    return [
        TransactionResponse(
            id=tx.id,
            type=tx.type.value if hasattr(tx.type, "value") else str(tx.type),
            amount_cents=tx.amount_cents,
            line_id=tx.line_id,
            driver_user_id=tx.driver_user_id,
            qrcode_id=tx.qrcode_id,
            created_at=tx.created_at,
        )
        for tx in txs
    ]