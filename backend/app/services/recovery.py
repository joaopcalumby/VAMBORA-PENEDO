"""
Armazenamento de códigos de recuperação de senha.

MVP usa um dicionário em memória — simples, funciona com 1 worker do
uvicorn. Para produção (múltiplos workers ou containers), migrar para
Redis ou uma tabela `password_recovery_codes` no banco. A interface
pública (issue/verify/consume) não muda.
"""
from __future__ import annotations

import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from threading import Lock

_CODE_TTL_MINUTES = 15
_CODE_LENGTH = 6  # dígitos


@dataclass
class _CodeEntry:
    code: str
    expires_at: datetime
    used: bool = False


_store: dict[str, _CodeEntry] = {}
_lock = Lock()


def _generate_numeric_code(length: int = _CODE_LENGTH) -> str:
    return "".join(str(secrets.randbelow(10)) for _ in range(length))


def issue_code(email: str) -> str:
    """Gera e armazena um código novo para o e-mail. Sobrescreve qualquer anterior."""
    code = _generate_numeric_code()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=_CODE_TTL_MINUTES)
    with _lock:
        _store[email.lower()] = _CodeEntry(code=code, expires_at=expires_at)
    return code


def verify_code(email: str, code: str) -> bool:
    """True se o código bate, está dentro do TTL e ainda não foi consumido."""
    with _lock:
        entry = _store.get(email.lower())
    if entry is None:
        return False
    if entry.used:
        return False
    if entry.code != code:
        return False
    if datetime.now(timezone.utc) > entry.expires_at:
        return False
    return True


def consume_code(email: str, code: str) -> bool:
    """Marca o código como usado após reset bem-sucedido. Retorna True se consumiu."""
    with _lock:
        entry = _store.get(email.lower())
        if entry is None or entry.used or entry.code != code:
            return False
        if datetime.now(timezone.utc) > entry.expires_at:
            return False
        entry.used = True
        return True
