from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import TokenPayload, get_db
from app.models.user import User
from app.models.wallet import QRCode, Transaction, TransactionType, Wallet
from app.schemas.wallet import (
    PaymentConfirmRequest,
    PaymentConfirmResponse,
    PaymentPreviewRequest,
    PaymentPreviewResponse,
)
from app.services.pricing import effective_category_for, price_cents_for

router = APIRouter(prefix="/pagamento", tags=["pagamento"])

DbDep = Annotated[Session, Depends(get_db)]


def _resolve_qrcode(db: Session, code: str) -> QRCode:
    qrcode = db.scalar(select(QRCode).where(QRCode.code == code))
    if qrcode is None or not qrcode.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="QR Code inválido ou inativo",
        )

    if not qrcode.is_demo and qrcode.expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="QR Code expirado",
        )
    return qrcode


def _load_user(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")
    return user


@router.post("/preview", response_model=PaymentPreviewResponse)
def preview(
    payload: PaymentPreviewRequest, token: TokenPayload, db: DbDep
) -> PaymentPreviewResponse:
    user = _load_user(db, int(token["sub"]))
    qrcode = _resolve_qrcode(db, payload.code)

    category = effective_category_for(db, user)
    amount = price_cents_for(db, qrcode.line, category)

    driver_user = qrcode.driver
    return PaymentPreviewResponse(
        qrcode_id=qrcode.id,
        driver_user_id=driver_user.id,
        driver_name=driver_user.name,
        line_id=qrcode.line.id,
        line_number=qrcode.line.number,
        line_name=qrcode.line.name,
        amount_cents=amount,
        user_category_slug=(category.slug if category else "padrao"),
    )


@router.post(
    "/confirmar",
    response_model=PaymentConfirmResponse,
    status_code=status.HTTP_201_CREATED,
)
def confirm(
    payload: PaymentConfirmRequest, token: TokenPayload, db: DbDep
) -> PaymentConfirmResponse:
    user = _load_user(db, int(token["sub"]))
    qrcode = _resolve_qrcode(db, payload.code)

    if user.wallet is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuário sem carteira",
        )

    category = effective_category_for(db, user)
    amount = price_cents_for(db, qrcode.line, category)

    if user.wallet.balance_cents < amount:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Saldo insuficiente",
        )

    try:
        user.wallet.balance_cents -= amount

        tx = Transaction(
            wallet_id=user.wallet.id,
            type=TransactionType.PAYMENT,
            amount_cents=amount,
            line_id=qrcode.line_id,
            driver_user_id=qrcode.driver_user_id,
            qrcode_id=qrcode.id,
        )
        db.add(tx)
        db.commit()
        db.refresh(tx)
    except Exception:
        db.rollback()
        raise

    return PaymentConfirmResponse(
        transaction_id=tx.id,
        amount_cents=amount,
        line_number=qrcode.line.number,
        line_name=qrcode.line.name,
        new_balance_cents=user.wallet.balance_cents,
        created_at=tx.created_at,
    )