from datetime import datetime, time
from typing import List, Optional

from pydantic import BaseModel

class UserCreate(BaseModel):
    email: str
    password: str
    username: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    email: str
    username: Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True

class LinhaCreate(BaseModel):
    nome: str
    tipo_transporte: str
    tarifa: float
    numero: Optional[int] = None
    info_pagamento: Optional[str] = "Dinheiro"

class LinhaResponse(BaseModel):
    id_linha: int
    nome: str
    tipo_transporte: str
    tarifa: float
    numero: Optional[int] = None
    info_pagamento: str

    class Config:
        orm_mode = True

class HorarioCreate(BaseModel):
    tipo_dia: str
    horario_partida: str
    id_linha: int

class HorarioResponse(BaseModel):
    id_horario: int
    tipo_dia: str
    horario_partida: time
    id_linha: int

    class Config:
        orm_mode = True

class LinhaTarifaResponse(BaseModel):
    id_linha: int
    nome: str
    tipo_transporte: str
    tarifa: float
    numero: Optional[int] = None
    info_pagamento: str

    class Config:
        orm_mode = True

class ViagemHistoricoResponse(BaseModel):
    id: int
    valor_pago: float
    data_viagem: datetime
    linha: LinhaTarifaResponse

    class Config:
        orm_mode = True

class CarteiraAbaResponse(BaseModel):
    tarifas_vigentes: List[LinhaTarifaResponse]
    historico_recente: List[ViagemHistoricoResponse]

    class Config:
        orm_mode = True

class FavoriteCreate(BaseModel):
    user_id: int
    linha_id: int

class FavoriteResponse(BaseModel):
    id: int
    user_id: int
    linha_id: int

    class Config:
        orm_mode = True

class FeedbackCreate(BaseModel):
    tipo: str
    descricao: str
    user_id: int

class FeedbackResponse(BaseModel):
    id_feedback: int
    tipo: str
    descricao: str
    data_envio: datetime
    user_id: int

    class Config:
        orm_mode = True

class ViagemCreate(BaseModel):
    valor_pago: float
    user_id: int
    linha_id: int

class ViagemResponse(BaseModel):
    id: int
    valor_pago: float
    data_viagem: datetime
    user_id: int
    linha_id: int

    class Config:
        orm_mode = True
