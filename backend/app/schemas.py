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
        from_attributes = True

class LinhaCreate(BaseModel):
    nome: str
    tipo_transporte: str
    tarifa: float
    numero: Optional[int] = None
    info_pagamento: Optional[List[str]] = ["Dinheiro"]

class LinhaResponse(BaseModel):
    id_linha: int
    nome: str
    tipo_transporte: str
    tarifa: float
    numero: Optional[int] = None
    info_pagamento: List[str]

    class Config:
        from_attributes = True

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
        from_attributes = True

class LinhaTarifaResponse(BaseModel):
    id_linha: int
    nome: str
    tipo_transporte: str
    tarifa: float
    numero: Optional[int] = None
    info_pagamento: List[str]

    class Config:
        from_attributes = True

class ViagemHistoricoResponse(BaseModel):
    id: int
    valor_pago: float
    data_viagem: datetime
    linha: LinhaTarifaResponse

    class Config:
        from_attributes = True

class CarteiraAbaResponse(BaseModel):
    tarifas_vigentes: List[LinhaTarifaResponse]
    historico_recente: List[ViagemHistoricoResponse]

    class Config:
        from_attributes = True

class FavoriteCreate(BaseModel):
    user_id: int
    linha_id: int

class FavoriteResponse(BaseModel):
    id: int
    user_id: int
    linha_id: int

    class Config:
        from_attributes = True

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
        from_attributes = True

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
        from_attributes = True

class AlertaCreate(BaseModel):
    titulo: str
    descricao: str
    tipo: str  # 'atraso', 'mudanca_horario', 'mudanca_rota', 'tarifa', 'proximidade'
    severidade: str  # 'baixa', 'media', 'alta'
    id_linha: Optional[int] = None
    minutos_atraso: Optional[int] = None
    horario_anterior: Optional[str] = None
    horario_novo: Optional[str] = None

class AlertaResponse(BaseModel):
    id: int
    titulo: str
    descricao: str
    tipo: str
    severidade: str
    ativa: bool
    lido: bool
    data_criacao: datetime
    data_atualizacao: datetime
    minutos_atraso: Optional[int] = None
    horario_anterior: Optional[str] = None
    horario_novo: Optional[str] = None
    id_linha: Optional[int]
    
    class Config:
        from_attributes = True

class AlertaProximidadeCreate(BaseModel):
    linha_id: int
    latitude_usuario: float
    longitude_usuario: float
    latitude_veiculo: Optional[float] = None
    longitude_veiculo: Optional[float] = None
    eta_minutos: Optional[int] = None

class AlertaProximidadeResponse(BaseModel):
    id: int
    user_id: int
    linha_id: int
    latitude_usuario: float
    longitude_usuario: float
    latitude_veiculo: Optional[float] = None
    longitude_veiculo: Optional[float] = None
    distancia_metros: Optional[int] = None
    eta_minutos: Optional[int] = None
    ativo: bool
    data_criacao: datetime
    data_ultima_atualizacao: datetime
    
    class Config:
        from_attributes = True
