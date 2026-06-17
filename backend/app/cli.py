from __future__ import annotations

import argparse
import sys
from datetime import datetime, timezone

from sqlalchemy import select

from app.database import SessionLocal
from app.models.user import (
    UserCategoryRequest,
    UserCategoryRequestStatus,
)


def _latest_pending(db, user_id: int) -> UserCategoryRequest | None:
    return db.scalar(
        select(UserCategoryRequest)
        .where(
            UserCategoryRequest.user_id == user_id,
            UserCategoryRequest.status == UserCategoryRequestStatus.PENDING,
        )
        .order_by(UserCategoryRequest.created_at.desc())
    )


def cmd_aprovar(args: argparse.Namespace) -> int:
    db = SessionLocal()
    try:
        req = _latest_pending(db, args.user_id)
        if req is None:
            print(f"Nenhuma solicitação pendente para o usuário {args.user_id}.")
            return 1
        req.status = UserCategoryRequestStatus.APPROVED
        req.reviewed_at = datetime.now(timezone.utc)
        req.justification = args.justificativa
        req.user.fare_category_id = req.category_id
        db.commit()
        print(
            f"[ok] Categoria '{req.category.slug}' aprovada para o usuário "
            f"{req.user.email} (id={req.user.id})."
        )
        return 0
    finally:
        db.close()


def cmd_rejeitar(args: argparse.Namespace) -> int:
    db = SessionLocal()
    try:
        req = _latest_pending(db, args.user_id)
        if req is None:
            print(f"Nenhuma solicitação pendente para o usuário {args.user_id}.")
            return 1
        req.status = UserCategoryRequestStatus.REJECTED
        req.reviewed_at = datetime.now(timezone.utc)
        req.justification = args.justificativa
        db.commit()
        print(
            f"[ok] Categoria '{req.category.slug}' rejeitada para o usuário "
            f"{req.user.email} (id={req.user.id})."
        )
        return 0
    finally:
        db.close()


def cmd_listar(_: argparse.Namespace) -> int:
    db = SessionLocal()
    try:
        pendings = db.scalars(
            select(UserCategoryRequest)
            .where(UserCategoryRequest.status == UserCategoryRequestStatus.PENDING)
            .order_by(UserCategoryRequest.created_at.asc())
        ).all()
        if not pendings:
            print("Nenhuma solicitação pendente.")
            return 0
        for req in pendings:
            print(
                f"#{req.id}  user={req.user.email} (id={req.user.id})  "
                f"categoria={req.category.slug}  documento={req.document_path or '-'}"
            )
        return 0
    finally:
        db.close()


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="python -m app.cli", description="CLI admin do Vambora")
    sub = parser.add_subparsers(dest="command", required=True)

    p_aprovar = sub.add_parser("aprovar-categoria", help="Aprova a última solicitação pendente do usuário")
    p_aprovar.add_argument("user_id", type=int)
    p_aprovar.add_argument("--justificativa", default=None)
    p_aprovar.set_defaults(func=cmd_aprovar)

    p_rejeitar = sub.add_parser("rejeitar-categoria", help="Rejeita a última solicitação pendente do usuário")
    p_rejeitar.add_argument("user_id", type=int)
    p_rejeitar.add_argument("--justificativa", required=True)
    p_rejeitar.set_defaults(func=cmd_rejeitar)

    p_listar = sub.add_parser("listar-solicitacoes", help="Lista todas as solicitações pendentes")
    p_listar.set_defaults(func=cmd_listar)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())