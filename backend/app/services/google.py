"""
Validação de id_token do Google.

Usa o endpoint público https://oauth2.googleapis.com/tokeninfo — evita
adicionar dependência ao SDK oficial do Google e mantém a integração
síncrona (consistente com o resto do backend).

Em produção considere:
- Cachear chaves públicas e validar a assinatura localmente, evitando
  uma chamada HTTP por login.
- Migrar para google-auth (oficial) se o volume crescer.
"""
from __future__ import annotations

import httpx
from fastapi import HTTPException, status

from app.core.config import get_settings

_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo"


def verify_google_id_token(id_token: str) -> dict:
    """
    Retorna o payload do id_token se a validação passar.

    Levanta HTTPException(401) em caso de token inválido, audience errada,
    ou erro de comunicação com o Google.
    """
    settings = get_settings()

    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(_TOKENINFO_URL, params={"id_token": id_token})
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Falha ao contatar o Google: {exc}",
        ) from exc

    if resp.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="id_token do Google inválido ou expirado",
        )

    data = resp.json()

    # Em dev, Google retorna `email_verified` como string "true"/"false".
    if str(data.get("email_verified", "")).lower() != "true":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail do Google não verificado",
        )

    # Audiência: se configurada, deve bater com o client_id da app.
    expected_aud = settings.google_client_id
    if expected_aud and data.get("aud") != expected_aud:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="id_token do Google não pertence a esta aplicação",
        )

    return data
