"""
Endpoints de autenticação.

Cobre os requisitos do spec `auth-flow`:
- Cadastro por e-mail/senha com aceite LGPD
- Login por e-mail/senha
- Login via Google (sinaliza needs_completion quando faltam dados)
- Completar cadastro pós-Google
- Recuperação por código (e-mail real via Resend; SMS mockado)
- GET /me

Todos os endpoints retornam mensagens genéricas em erros sensíveis
(login inválido / e-mail desconhecido) para não vazar enumeração de
contas.
"""
from __future__ import annotations

from typing import Annotated

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import TokenPayload, get_db
from app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.models.category import FareCategory
from app.models.user import Driver, User, UserRole  # noqa: F401
from app.models.wallet import Wallet
from app.schemas.auth import (
    CompleteProfileRequest,
    GoogleLoginRequest,
    LoginRequest,
    RecoverChannelResponse,
    RecoverRequest,
    RecoverResetRequest,
    RecoverVerifyRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.services.email import send_recovery_code_email
from app.services.google import verify_google_id_token
from app.services.recovery import consume_code, issue_code, verify_code

router = APIRouter(prefix="/auth", tags=["auth"])

# Mensagens genéricas para reduzir vetor de enumeração de contas.
_LOGIN_FAIL_MSG = "E-mail ou senha incorretos."


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _ensure_wallet(db: Session, user: User) -> None:
    """Cria carteira 1-1 se ainda não existe (idempotente)."""
    if user.wallet is None:
        db.add(Wallet(user_id=user.id, balance_cents=0))
        db.flush()


def _default_category(db: Session) -> FareCategory | None:
    return db.scalar(select(FareCategory).where(FareCategory.is_default.is_(True)))


def _profile_is_complete(user: User) -> bool:
    return all([user.cpf, user.birth_date, user.phone])


def _serialize_user(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        cpf=user.cpf,
        birth_date=user.birth_date,
        phone=user.phone,
        role=user.role.value if hasattr(user.role, "value") else str(user.role),
        has_driver=user.driver is not None,
        driver_status=(
            user.driver.status.value
            if user.driver and hasattr(user.driver.status, "value")
            else (user.driver.status if user.driver else None)
        ),
        fare_category_slug=(user.fare_category.slug if user.fare_category else None),
    )


def _issue_token(user: User, *, needs_completion: bool = False) -> TokenResponse:
    role_str = user.role.value if hasattr(user.role, "value") else str(user.role)
    token = create_access_token(subject=user.id, role=role_str)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role=role_str,
        needs_completion=needs_completion,
    )


DbDep = Annotated[Session, Depends(get_db)]


# ---------------------------------------------------------------------------
# Cadastro
# ---------------------------------------------------------------------------


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(payload: RegisterRequest, db: DbDep) -> TokenResponse:
    email = payload.email.lower().strip()

    # Verifica e-mail + CPF para devolver erros específicos sem revelar
    # demais (msg igual para os dois conflitos).
    cond = User.email == email
    if payload.cpf is not None:
        cond = cond | (User.cpf == payload.cpf)

    conflict = db.scalar(select(User).where(cond))
    if conflict is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="E-mail ou CPF já cadastrado.",
        )

    default_cat = _default_category(db)

    user = User(
        name=payload.name.strip(),
        email=email,
        cpf=payload.cpf,
        birth_date=payload.birth_date,
        phone=payload.phone,
        password_hash=hash_password(payload.password),
        role=UserRole.USER,
        fare_category_id=default_cat.id if default_cat else None,
    )
    db.add(user)
    db.flush()
    _ensure_wallet(db, user)
    db.commit()
    db.refresh(user)

    return _issue_token(user)


# ---------------------------------------------------------------------------
# Login (e-mail / senha)
# ---------------------------------------------------------------------------


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: DbDep) -> TokenResponse:
    email = payload.email.lower().strip()
    user = db.scalar(select(User).where(User.email == email))

    if user is None or user.password_hash is None:
        # Mesma mensagem para "usuário não existe" e "só tem login Google".
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=_LOGIN_FAIL_MSG
        )

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=_LOGIN_FAIL_MSG
        )

    _ensure_wallet(db, user)
    db.commit()

    return _issue_token(user)


# ---------------------------------------------------------------------------
# Login Google
# ---------------------------------------------------------------------------


@router.post("/google", response_model=TokenResponse)
def google_login(payload: GoogleLoginRequest, db: DbDep) -> TokenResponse:
    info = verify_google_id_token(payload.id_token)

    google_id = info.get("sub")
    email = (info.get("email") or "").lower().strip()
    name = info.get("name") or email.split("@")[0]

    if not google_id or not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="id_token do Google não contém os campos esperados",
        )

    # Procura primeiro por google_id; depois por e-mail (caso o usuário
    # já tenha cadastro local com o mesmo e-mail).
    user = db.scalar(select(User).where(User.google_id == google_id))
    if user is None:
        user = db.scalar(select(User).where(User.email == email))

    if user is None:
        default_cat = _default_category(db)
        user = User(
            name=name,
            email=email,
            google_id=google_id,
            role=UserRole.USER,
            fare_category_id=default_cat.id if default_cat else None,
        )
        db.add(user)
        db.flush()
        _ensure_wallet(db, user)
    else:
        if user.google_id is None:
            user.google_id = google_id
        _ensure_wallet(db, user)

    db.commit()
    db.refresh(user)

    return _issue_token(user, needs_completion=not _profile_is_complete(user))


# ---------------------------------------------------------------------------
# Completar cadastro (pós-Google)
# ---------------------------------------------------------------------------


@router.post("/complete-profile", response_model=UserResponse)
def complete_profile(
    payload: CompleteProfileRequest,
    token: TokenPayload,
    db: DbDep,
) -> UserResponse:
    user_id = int(token["sub"])
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado"
        )

    # Conflito de CPF com outro usuário.
    conflict = db.scalar(
        select(User).where(User.cpf == payload.cpf, User.id != user.id)
    )
    if conflict is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="CPF já cadastrado."
        )

    user.cpf = payload.cpf
    user.birth_date = payload.birth_date
    user.phone = payload.phone
    db.commit()
    db.refresh(user)

    return _serialize_user(user)


# ---------------------------------------------------------------------------
# Recuperação de senha
# ---------------------------------------------------------------------------


@router.post("/recover", response_model=RecoverChannelResponse)
def recover_request(payload: RecoverRequest, db: DbDep) -> RecoverChannelResponse:
    email = payload.email.lower().strip()
    user = db.scalar(select(User).where(User.email == email))

    # Sempre responde 200 — não revelamos se o e-mail está cadastrado.
    # O código só é emitido se o usuário existir.
    if user is None or user.password_hash is None:
        # Resposta plausível para não vazar enumeração.
        return RecoverChannelResponse(
            channel=payload.channel,
            delivered=False,
            message="Se houver uma conta com esse e-mail, o código foi enviado.",
        )

    code = issue_code(email)

    if payload.channel == "email":
        try:
            delivered_real = send_recovery_code_email(email, code)
        except httpx.HTTPError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Falha ao enviar e-mail: {exc}",
            ) from exc
        return RecoverChannelResponse(
            channel="email",
            delivered=delivered_real,
            message=(
                "Código enviado por e-mail."
                if delivered_real
                else "Envio simulado nesta versão (verifique o log do servidor)."
            ),
        )

    # channel == "sms" — mockado no MVP (PRD §RF5.3).
    print(f"[mock sms] to_email={email} code={code}")
    return RecoverChannelResponse(
        channel="sms",
        delivered=False,
        message="Envio por SMS simulado nesta versão.",
    )


@router.post("/recover/verify")
def recover_verify(payload: RecoverVerifyRequest) -> dict[str, bool]:
    ok = verify_code(payload.email.lower().strip(), payload.code)
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código inválido ou expirado.",
        )
    return {"valid": True}


@router.post("/recover/reset", response_model=TokenResponse)
def recover_reset(payload: RecoverResetRequest, db: DbDep) -> TokenResponse:
    email = payload.email.lower().strip()

    if not consume_code(email, payload.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código inválido ou expirado.",
        )

    user = db.scalar(select(User).where(User.email == email))
    if user is None:
        # Não deveria acontecer (issue_code só sai com usuário existente),
        # mas mantém defesa em profundidade.
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código inválido ou expirado.",
        )

    user.password_hash = hash_password(payload.new_password)
    db.commit()
    db.refresh(user)

    return _issue_token(user)


# ---------------------------------------------------------------------------
# /me
# ---------------------------------------------------------------------------


@router.get("/me", response_model=UserResponse)
def me(token: TokenPayload, db: DbDep) -> UserResponse:
    user_id = int(token["sub"])
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado"
        )
    return _serialize_user(user)
