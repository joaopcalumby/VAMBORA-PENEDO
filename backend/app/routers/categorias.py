from __future__ import annotations

import secrets
import shutil
from pathlib import Path
from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import TokenPayload, get_db
from app.models.category import FareCategory
from app.models.user import (
    User,
    UserCategoryRequest,
    UserCategoryRequestStatus,
)
from app.schemas.categoria import CategoryRequestResponse, CategoryResponse

router = APIRouter(prefix="/categorias", tags=["categorias"])

DbDep = Annotated[Session, Depends(get_db)]

_UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads" / "categoria"
_ALLOWED_MIME = {"image/jpeg", "image/png", "application/pdf"}
_MAX_BYTES = 5 * 1024 * 1024  # 5 MB


def _serialize_category(cat: FareCategory) -> CategoryResponse:
    return CategoryResponse(
        id=cat.id,
        slug=cat.slug,
        name=cat.name,
        requires_document=cat.requires_document,
        is_default=cat.is_default,
    )


def _serialize_request(req: UserCategoryRequest) -> CategoryRequestResponse:
    status_val = req.status.value if hasattr(req.status, "value") else str(req.status)
    return CategoryRequestResponse(
        id=req.id,
        category_id=req.category_id,
        category_slug=req.category.slug,
        category_name=req.category.name,
        status=status_val,
        document_path=req.document_path,
        justification=req.justification,
        created_at=req.created_at,
        reviewed_at=req.reviewed_at,
    )


@router.get("", response_model=list[CategoryResponse])
def list_categories(db: DbDep) -> list[CategoryResponse]:
    cats = db.scalars(select(FareCategory).order_by(FareCategory.id.asc())).all()
    return [_serialize_category(c) for c in cats]


@router.post(
    "/solicitar",
    response_model=CategoryRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
async def solicitar_categoria(
    token: TokenPayload,
    db: DbDep,
    category_slug: str = Form(..., min_length=1, max_length=32),
    document: UploadFile = File(...),
) -> CategoryRequestResponse:
    user_id = int(token["sub"])
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")

    category = db.scalar(select(FareCategory).where(FareCategory.slug == category_slug))
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoria não encontrada")

    if not category.requires_document:
        user.fare_category_id = category.id
        db.commit()
       
        existing = db.scalar(
            select(UserCategoryRequest).where(
                UserCategoryRequest.user_id == user_id,
                UserCategoryRequest.category_id == category.id,
            )
        )
        if existing is None:
            existing = UserCategoryRequest(
                user_id=user_id,
                category_id=category.id,
                status=UserCategoryRequestStatus.APPROVED,
            )
            db.add(existing)
            db.commit()
            db.refresh(existing)
        return _serialize_request(existing)

    if document.content_type not in _ALLOWED_MIME:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Tipo de arquivo não permitido. Aceitos: JPG, PNG, PDF.",
        )

    content = await document.read()
    if len(content) > _MAX_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Arquivo excede o limite de 5 MB.",
        )

    _UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    ext = Path(document.filename or "").suffix.lower() or ".bin"
    filename = f"user{user_id}-{secrets.token_hex(8)}{ext}"
    target = _UPLOAD_DIR / filename
    target.write_bytes(content)

    user.fare_category_id = category.id

    existing = db.scalar(
        select(UserCategoryRequest).where(
            UserCategoryRequest.user_id == user_id,
            UserCategoryRequest.category_id == category.id,
            UserCategoryRequest.status == UserCategoryRequestStatus.PENDING,
        )
    )
    if existing is not None:
        existing.document_path = str(target.relative_to(_UPLOAD_DIR.parent.parent))
        db.commit()
        db.refresh(existing)
        return _serialize_request(existing)

    request_row = UserCategoryRequest(
        user_id=user_id,
        category_id=category.id,
        status=UserCategoryRequestStatus.PENDING,
        document_path=str(target.relative_to(_UPLOAD_DIR.parent.parent)),
    )
    db.add(request_row)
    db.commit()
    db.refresh(request_row)
    return _serialize_request(request_row)


@router.get("/minha-solicitacao", response_model=CategoryRequestResponse | None)
def minha_solicitacao(token: TokenPayload, db: DbDep) -> CategoryRequestResponse | None:
    user_id = int(token["sub"])
    req = db.scalar(
        select(UserCategoryRequest)
        .where(UserCategoryRequest.user_id == user_id)
        .order_by(UserCategoryRequest.created_at.desc())
    )
    if req is None:
        return None
    return _serialize_request(req)