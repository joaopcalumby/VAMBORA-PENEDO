"""
Envio de e-mails transacionais via Resend (https://resend.com).

Plano gratuito do Resend cobre 3.000 e-mails/mês — suficiente para o MVP.
Se RESEND_API_KEY estiver vazio, o serviço degrada para modo mock:
imprime no console em vez de enviar — útil em desenvolvimento sem chave.
"""
from __future__ import annotations

import httpx

from app.core.config import get_settings

_RESEND_URL = "https://api.resend.com/emails"


def send_recovery_code_email(to_email: str, code: str) -> bool:
    """
    Envia o código de recuperação por e-mail.

    Retorna True se o envio real ocorreu, False se foi mockado.
    Levanta httpx.HTTPError em caso de falha de rede / API.
    """
    settings = get_settings()

    if not settings.resend_api_key:
        # Modo mock: registra no log do servidor.
        print(f"[mock email] to={to_email} code={code}")
        return False

    payload = {
        "from": settings.mail_from,
        "to": [to_email],
        "subject": "Vambora Penedo — Código de recuperação de senha",
        "html": (
            "<p>Olá,</p>"
            "<p>Use o código abaixo para redefinir sua senha do Vambora Penedo:</p>"
            f"<p style=\"font-size:22px;font-weight:600;letter-spacing:4px\">{code}</p>"
            "<p>O código é válido por 15 minutos. Se você não solicitou, ignore este e-mail.</p>"
        ),
    }
    with httpx.Client(timeout=10.0) as client:
        resp = client.post(
            _RESEND_URL,
            json=payload,
            headers={"Authorization": f"Bearer {settings.resend_api_key}"},
        )
    resp.raise_for_status()
    return True
