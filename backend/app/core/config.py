from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# Caminho para o diretório raiz do projeto (onde está o arquivo .env)
# config.py está em backend/app/core/config.py
ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ROOT_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    database_url: str = "sqlite:///./vambora.db"

    jwt_secret: str = Field(
        ...,
        description=(
            "Chave para assinar JWTs. Gere com: "
            "python -c 'import secrets; print(secrets.token_urlsafe(32))'"
        ),
    )
    jwt_algorithm: str = "HS256"
    jwt_exp_hours: int = 24

    allowed_origins: str = "http://localhost:3000"

    google_client_id: str = ""
    google_client_secret: str = ""

    resend_api_key: str = ""
    mail_from: str = "no-reply@vamborapenedo.com.br"

    debug: bool = False

    @property
    def allowed_origins_list(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.allowed_origins.split(",")
            if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()