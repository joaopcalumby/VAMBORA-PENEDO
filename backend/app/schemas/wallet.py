from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field

TransactionKind = Literal["recharge", "payment"]


class TransactionResponse(BaseModel):
    id: int
    type: TransactionKind
    amount_cents: int
    line_id: Optional[int] = None
    driver_user_id: Optional[int] = None
    qrcode_id: Optional[int] = None
    created_at: datetime


class WalletResponse(BaseModel):
    balance_cents: int
    last_transactions: list[TransactionResponse]


class RechargeRequest(BaseModel):
    amount_cents: int = Field(gt=0, le=100_000_00, description="Valor em centavos (max R$ 100.000)")


class PaymentPreviewRequest(BaseModel):
    code: str = Field(min_length=4, max_length=64)


class PaymentPreviewResponse(BaseModel):
    qrcode_id: int
    driver_user_id: int
    driver_name: str
    line_id: int
    line_number: str
    line_name: str
    amount_cents: int
    user_category_slug: str


class PaymentConfirmRequest(BaseModel):
    code: str = Field(min_length=4, max_length=64)


class PaymentConfirmResponse(BaseModel):
    transaction_id: int
    amount_cents: int
    line_number: str
    line_name: str
    new_balance_cents: int
    created_at: datetime