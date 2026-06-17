from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.deps import TokenPayload, get_db
from app.models.user import User
from app.models.wallet import Transaction, TransactionType, Wallet
from app.schemas.wallet import (
    RechargeRequest,
    TransactionResponse,
    WalletResponse,
)

router = APIRouter(prefix="/carteira", tags=["carteira"])

DbDep = Annotated[Session, Depends(get_db)]

_LAST_TRANSACTIONS_LIMIT = 10


def _serialize_tx(tx: Transaction) -> TransactionResponse:
    kind = tx.type.value if hasattr(tx.type, "value") else str(tx.type)
    return TransactionResponse(
        id=tx.id,
        type=kind,
        amount_cents=tx.amount_cents,
        line_id=tx.line_id,
        driver_user_id=tx.driver_user_id,
        qrcode_id=tx.qrcode_id,
        created_at=tx.created_at,
    )


def _get_or_create_wallet(db: Session, user_id: int) -> Wallet:
    wallet = db.scalar(
        select(Wallet).where(Wallet.user_id == user_id).options(selectinload(Wallet.transactions))
    )
    if wallet is None:
        if db.get(User, user_id) is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")
        wallet = Wallet(user_id=user_id, balance_cents=0)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    return wallet


@router.get("", response_model=WalletResponse)
def get_wallet(token: TokenPayload, db: DbDep) -> WalletResponse:
    user_id = int(token["sub"])
    wallet = _get_or_create_wallet(db, user_id)

    last_txs = db.scalars(
        select(Transaction)
        .where(Transaction.wallet_id == wallet.id)
        .order_by(Transaction.created_at.desc())
        .limit(_LAST_TRANSACTIONS_LIMIT)
    ).all()

    return WalletResponse(
        balance_cents=wallet.balance_cents,
        last_transactions=[_serialize_tx(tx) for tx in last_txs],
    )


@router.post(
    "/recarga",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
)
def recharge(
    payload: RechargeRequest, token: TokenPayload, db: DbDep
) -> TransactionResponse:
    user_id = int(token["sub"])
    wallet = _get_or_create_wallet(db, user_id)

    wallet.balance_cents += payload.amount_cents

    tx = Transaction(
        wallet_id=wallet.id,
        type=TransactionType.RECHARGE,
        amount_cents=payload.amount_cents,
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return _serialize_tx(tx)


@router.get("/transacoes", response_model=list[TransactionResponse])
def list_all_transactions(token: TokenPayload, db: DbDep) -> list[TransactionResponse]:
    user_id = int(token["sub"])
    wallet = _get_or_create_wallet(db, user_id)
    txs = db.scalars(
        select(Transaction)
        .where(Transaction.wallet_id == wallet.id)
        .order_by(Transaction.created_at.desc())
    ).all()
    return [_serialize_tx(tx) for tx in txs]