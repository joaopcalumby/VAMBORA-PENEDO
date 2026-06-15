from typing import Annotated, Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.database import get_db as _get_db_session

_bearer_scheme = HTTPBearer(auto_error=True)


def get_db() -> Session:
    yield from _get_db_session()


CredsDep = Annotated[HTTPAuthorizationCredentials, Depends(_bearer_scheme)]


def get_current_token_payload(credentials: CredsDep) -> dict[str, Any]:
    try:
        payload = decode_access_token(credentials.credentials)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if "sub" not in payload or "role" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token incompleto",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return payload


TokenPayload = Annotated[dict[str, Any], Depends(get_current_token_payload)]


def require_role(*allowed_roles: str):
    
    allowed = set(allowed_roles)

    def _checker(payload: TokenPayload) -> dict[str, Any]:
        if payload.get("role") not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permissão insuficiente para acessar este recurso",
            )
        return payload

    return _checker