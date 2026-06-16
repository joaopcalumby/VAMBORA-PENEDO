"""
Funções de carga dos dados de seed.

Cada loader é idempotente: faz upsert por chave natural (slug, número
da linha, email do usuário, etc.) — rodar duas vezes não duplica.

GeoJSON: coordenadas vêm como [longitude, latitude] (ordem da spec).
Convertemos para o nosso formato (latitude, longitude) na leitura.
"""
from __future__ import annotations

import json
import secrets
from datetime import datetime, time, timedelta, timezone
from pathlib import Path
from typing import Any

import yaml
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models import (
    DayType,
    Driver,
    DriverStatus,
    FareCategory,
    FareCategoryPrice,
    Line,
    Modal,
    QRCode,
    Route,
    RoutePoint,
    Schedule,
    Stop,
    User,
    UserRole,
    Wallet,
)

DATA_DIR = Path(__file__).resolve().parent / "data"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _read_yaml(name: str) -> Any:
    path = DATA_DIR / name
    with path.open(encoding="utf-8") as fh:
        return yaml.safe_load(fh)


def _read_json(path: Path) -> Any:
    with path.open(encoding="utf-8") as fh:
        return json.load(fh)


_MODAL_BR_TO_EN = {
    "onibus": Modal.BUS,
    "ônibus": Modal.BUS,
    "bus": Modal.BUS,
    "van": Modal.VAN,
    "balsa": Modal.FERRY,
    "lancha": Modal.FERRY,
    "ferry": Modal.FERRY,
}


def _modal_from_str(raw: str) -> Modal:
    key = (raw or "").strip().lower()
    if key not in _MODAL_BR_TO_EN:
        raise ValueError(f"Modal desconhecido: '{raw}'")
    return _MODAL_BR_TO_EN[key]


def _reais_to_cents(value: float | int) -> int:
    return int(round(float(value) * 100))


# ---------------------------------------------------------------------------
# Categorias tarifárias
# ---------------------------------------------------------------------------


def seed_categorias(db: Session) -> dict[str, FareCategory]:
    raw_list = _read_yaml("categorias.yaml")
    by_slug: dict[str, FareCategory] = {}

    for raw in raw_list:
        slug = raw["slug"]
        existing = db.scalar(select(FareCategory).where(FareCategory.slug == slug))

        if existing:
            existing.name = raw["name"]
            existing.requires_document = bool(raw.get("requires_document", False))
            existing.is_default = bool(raw.get("is_default", False))
            by_slug[slug] = existing
        else:
            cat = FareCategory(
                slug=slug,
                name=raw["name"],
                requires_document=bool(raw.get("requires_document", False)),
                is_default=bool(raw.get("is_default", False)),
            )
            db.add(cat)
            by_slug[slug] = cat

    db.flush()
    return by_slug


# ---------------------------------------------------------------------------
# Linhas (metadata) + preços por categoria
# ---------------------------------------------------------------------------


def seed_linhas(
    db: Session,
    categorias: dict[str, FareCategory],
) -> dict[str, Line]:
    raw = _read_yaml("linhas.yaml")
    by_number: dict[str, Line] = {}

    for number, data in raw.items():
        number = str(number)
        existing = db.scalar(select(Line).where(Line.number == number))

        modal = _modal_from_str(data["modal"])
        default_cents = _reais_to_cents(data["default_price"])

        if existing:
            existing.name = data["name"]
            existing.modal = modal
            existing.default_price_cents = default_cents
            line = existing
        else:
            line = Line(
                number=number,
                name=data["name"],
                modal=modal,
                default_price_cents=default_cents,
            )
            db.add(line)
            db.flush()

        # Preços por categoria (upsert por (line_id, category_id))
        category_prices = data.get("category_prices", {}) or {}
        for cat_slug, price in category_prices.items():
            if cat_slug not in categorias:
                raise ValueError(
                    f"Linha {number}: categoria desconhecida '{cat_slug}' em "
                    "category_prices. Verifique categorias.yaml."
                )
            cat = categorias[cat_slug]
            existing_price = db.scalar(
                select(FareCategoryPrice).where(
                    FareCategoryPrice.line_id == line.id,
                    FareCategoryPrice.category_id == cat.id,
                )
            )
            cents = _reais_to_cents(price)
            if existing_price:
                existing_price.price_cents = cents
            else:
                db.add(
                    FareCategoryPrice(
                        line_id=line.id,
                        category_id=cat.id,
                        price_cents=cents,
                    )
                )

        by_number[number] = line

    db.flush()
    return by_number


# ---------------------------------------------------------------------------
# Horários
# ---------------------------------------------------------------------------


_DAY_TYPE_KEYS = {
    "weekday": DayType.WEEKDAY,
    "saturday": DayType.SATURDAY,
    "sunday_holiday": DayType.SUNDAY_HOLIDAY,
}


def seed_horarios(db: Session, linhas: dict[str, Line]) -> None:
    raw = _read_yaml("horarios.yaml")

    for number, by_day in raw.items():
        number = str(number)
        if number not in linhas:
            raise ValueError(
                f"horarios.yaml: linha '{number}' não está em linhas.yaml."
            )
        line = linhas[number]

        # Recria os horários da linha do zero (mais simples que diffar).
        db.query(Schedule).filter(Schedule.line_id == line.id).delete()

        for day_key, times in (by_day or {}).items():
            if day_key not in _DAY_TYPE_KEYS:
                raise ValueError(
                    f"Linha {number}: day_type desconhecido '{day_key}'. "
                    "Aceitos: weekday, saturday, sunday_holiday."
                )
            day_type = _DAY_TYPE_KEYS[day_key]

            for hhmm in times or []:
                hours, minutes = hhmm.split(":")
                db.add(
                    Schedule(
                        line_id=line.id,
                        day_type=day_type,
                        departure_time=time(int(hours), int(minutes)),
                    )
                )

    db.flush()


# ---------------------------------------------------------------------------
# Pontos e Rotas (GeoJSON)
# ---------------------------------------------------------------------------


def _approx_eq(a: float, b: float, tol: float = 1e-5) -> bool:
    return abs(a - b) < tol


def _find_stop(db: Session, name: str, lat: float, lng: float) -> Stop | None:
    # Dedupe por (name) primeiro; se houver, conferir lat/lng aproximado.
    candidates = db.scalars(select(Stop).where(Stop.name == name)).all()
    for c in candidates:
        if _approx_eq(c.latitude, lat) and _approx_eq(c.longitude, lng):
            return c
    return None


def seed_geojsons(db: Session, linhas: dict[str, Line]) -> None:
    geojson_paths = sorted(DATA_DIR.glob("linha_*.geojson"))

    if not geojson_paths:
        print("  (nenhum arquivo linha_*.geojson encontrado em data/)")
        return

    for path in geojson_paths:
        print(f"  -> {path.name}")
        data = _read_json(path)

        # Descobrir linha a partir da primeira Feature com properties.linha.
        line_number: str | None = None
        for feat in data.get("features", []):
            line_number = feat.get("properties", {}).get("linha")
            if line_number is not None:
                break

        if line_number is None:
            raise ValueError(
                f"{path.name}: nenhuma Feature contém properties.linha."
            )
        line_number = str(line_number)

        if line_number not in linhas:
            raise ValueError(
                f"{path.name}: linha '{line_number}' não está em linhas.yaml."
            )
        line = linhas[line_number]

        # Limpar Route+RoutePoints da linha (recria a partir do GeoJSON).
        db.query(Route).filter(Route.line_id == line.id).delete()
        db.flush()

        route = Route(line_id=line.id)
        db.add(route)
        db.flush()

        for feat in data["features"]:
            props = feat.get("properties", {}) or {}
            tipo = props.get("tipo")
            geom = feat.get("geometry", {}) or {}
            geom_type = geom.get("type")
            coords = geom.get("coordinates") or []

            if tipo == "ponto_parada" and geom_type == "Point":
                lng, lat = float(coords[0]), float(coords[1])
                modal = _modal_from_str(props.get("modal") or line.modal.value)
                name = props.get("nome") or "Ponto sem nome"

                stop = _find_stop(db, name, lat, lng)
                if stop is None:
                    stop = Stop(name=name, latitude=lat, longitude=lng, modal=modal)
                    db.add(stop)
                    db.flush()

                if line not in stop.lines:
                    stop.lines.append(line)

            elif tipo == "rota" and geom_type == "LineString":
                for seq, (lng, lat) in enumerate(coords):
                    db.add(
                        RoutePoint(
                            route_id=route.id,
                            sequence=seq,
                            latitude=float(lat),
                            longitude=float(lng),
                        )
                    )

    db.flush()


# ---------------------------------------------------------------------------
# Usuários (admin + motoristas)
# ---------------------------------------------------------------------------


def _upsert_user(
    db: Session,
    *,
    name: str,
    email: str,
    password: str,
    role: UserRole,
    phone: str | None = None,
    cpf: str | None = None,
) -> User:
    existing = db.scalar(select(User).where(User.email == email))
    if existing:
        existing.name = name
        existing.role = role
        existing.phone = phone
        existing.cpf = cpf
        existing.password_hash = hash_password(password)
        user = existing
    else:
        user = User(
            name=name,
            email=email,
            cpf=cpf,
            phone=phone,
            password_hash=hash_password(password),
            role=role,
        )
        db.add(user)
        db.flush()

    # Garante carteira (1-1) com saldo zero.
    if user.wallet is None:
        db.add(Wallet(user_id=user.id, balance_cents=0))

    return user


def seed_usuarios(db: Session) -> dict[str, User]:
    raw = _read_yaml("usuarios.yaml")
    result: dict[str, User] = {}

    for admin_raw in raw.get("admins", []) or []:
        user = _upsert_user(
            db,
            name=admin_raw["name"],
            email=admin_raw["email"],
            password=admin_raw["password"],
            role=UserRole.ADMIN,
            phone=admin_raw.get("phone"),
            cpf=admin_raw.get("cpf"),
        )
        result[admin_raw["email"]] = user

    for driver_raw in raw.get("drivers", []) or []:
        user = _upsert_user(
            db,
            name=driver_raw["name"],
            email=driver_raw["email"],
            password=driver_raw["password"],
            role=UserRole.DRIVER,
            phone=driver_raw.get("phone"),
            cpf=driver_raw.get("cpf"),
        )

        # Upsert Driver (extensão 1-1).
        status = DriverStatus(driver_raw.get("status", "pending"))
        existing_driver = db.scalar(select(Driver).where(Driver.user_id == user.id))
        if existing_driver:
            existing_driver.professional_id = driver_raw["professional_id"]
            existing_driver.status = status
        else:
            db.add(
                Driver(
                    user_id=user.id,
                    professional_id=driver_raw["professional_id"],
                    status=status,
                    approved_at=datetime.now(timezone.utc)
                    if status == DriverStatus.APPROVED
                    else None,
                )
            )

        result[driver_raw["email"]] = user

    db.flush()
    return result


# ---------------------------------------------------------------------------
# QR Codes de demonstração
# ---------------------------------------------------------------------------


def seed_qrcodes_demo(
    db: Session,
    usuarios: dict[str, User],
    linhas: dict[str, Line],
) -> None:
    # Cria um QR demo por motorista aprovado, vinculado à primeira linha
    # disponível. is_demo=True e expires_at no futuro distante (PRD §RF8.5
    # diz 5min em produção; demo é exceto via flag).
    drivers = [u for u in usuarios.values() if u.role == UserRole.DRIVER]
    if not drivers or not linhas:
        print("  (sem motoristas ou linhas — nenhum QR Code demo criado)")
        return

    line = next(iter(linhas.values()))
    expires = datetime.now(timezone.utc) + timedelta(days=365 * 5)

    for i, driver in enumerate(drivers):
        # Code estável por motorista para idempotência.
        code = f"DEMO-{driver.id:04d}-{i:02d}"
        existing = db.scalar(select(QRCode).where(QRCode.code == code))
        if existing:
            existing.line_id = line.id
            existing.expires_at = expires
            existing.is_demo = True
            existing.is_active = True
            continue

        db.add(
            QRCode(
                code=code,
                driver_user_id=driver.id,
                line_id=line.id,
                expires_at=expires,
                is_demo=True,
                is_active=True,
            )
        )

    db.flush()
