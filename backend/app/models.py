from datetime import datetime, time
from typing import List, Optional
from sqlalchemy import ForeignKey, func, String, Float, Time
from sqlalchemy.orm import Mapped, mapped_column, registry, relationship

table_registry = registry()

@table_registry.mapped_as_dataclass
class User:
    __tablename__ = 'users'

    id: Mapped[int] = mapped_column(init=False, primary_key=True)
    email: Mapped[str] = mapped_column(unique=True, index=True)
    password: Mapped[str]
    username: Mapped[Optional[str]] = mapped_column(default=None)
    
    created_at: Mapped[datetime] = mapped_column(
        init=False, server_default=func.now()
    )

    favorites: Mapped[List["Favorite"]] = relationship(back_populates="user", init=False, default_factory=list)
    feedbacks: Mapped[List["Feedback"]] = relationship(back_populates="user", init=False, default_factory=list)

@table_registry.mapped_as_dataclass
class Linha:
    __tablename__ = 'linhas'
    
    id_linha: Mapped[int] = mapped_column(init=False, primary_key=True)
    nome: Mapped[str]
    tipo_transporte: Mapped[str]
    tarifa: Mapped[float] = mapped_column(Float)
    numero: Mapped[Optional[int]] = mapped_column(default=None)
    info_pagamento: Mapped[str] = mapped_column(String, default="Dinheiro")
    horarios: Mapped[List["Horario"]] = relationship(back_populates="linha", init=False, default_factory=list)

@table_registry.mapped_as_dataclass
class Horario:
    __tablename__ = 'horarios'
    
    id_horario: Mapped[int] = mapped_column(init=False, primary_key=True)
    tipo_dia: Mapped[str]
    horario_partida: Mapped[time] = mapped_column(Time)
    id_linha: Mapped[int] = mapped_column(ForeignKey('linhas.id_linha'))
    
    linha: Mapped["Linha"] = relationship(back_populates="horarios", init=False)

@table_registry.mapped_as_dataclass
class PontoDeParada:
    __tablename__ = 'pontos_parada'
    
    id_ponto: Mapped[int] = mapped_column(init=False, primary_key=True)
    nome: Mapped[str]
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)

@table_registry.mapped_as_dataclass
class Favorite:
    __tablename__ = 'favorites'
    
    id: Mapped[int] = mapped_column(init=False, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'))
    linha_id: Mapped[int] = mapped_column(ForeignKey('linhas.id_linha'))
    
    user: Mapped["User"] = relationship(back_populates="favorites", init=False)

@table_registry.mapped_as_dataclass
class Feedback:
    __tablename__ = 'feedbacks'
    
    id_feedback: Mapped[int] = mapped_column(init=False, primary_key=True)
    tipo: Mapped[str]
    descricao: Mapped[str] = mapped_column(String)
    data_envio: Mapped[datetime] = mapped_column(init=False, server_default=func.now())
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'))
    
    user: Mapped["User"] = relationship(back_populates="feedbacks", init=False)

@table_registry.mapped_as_dataclass
class Viagem:
    __tablename__ = 'viagens'
    
    id: Mapped[int] = mapped_column(init=False, primary_key=True)
    valor_pago: Mapped[float] = mapped_column(Float)
    data_viagem: Mapped[datetime] = mapped_column(init=False, server_default=func.now())
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'))
    linha_id: Mapped[int] = mapped_column(ForeignKey('linhas.id_linha'))
    
    # Relacionamentos para facilitar a busca (back_populates não é obrigatório aqui, mas ajuda)
    user: Mapped["User"] = relationship(init=False)
    linha: Mapped["Linha"] = relationship(init=False)

@table_registry.mapped_as_dataclass
class Alerta:
    __tablename__ = 'alertas'
    
    id: Mapped[int] = mapped_column(init=False, primary_key=True)
    titulo: Mapped[str]
    descricao: Mapped[str]
    tipo: Mapped[str] # 'atraso', 'mudanca_horario', 'mudanca_rota', 'tarifa', 'proximidade'
    severidade: Mapped[str] # 'baixa', 'media', 'alta'
    ativa: Mapped[bool] = mapped_column(default=True)
    lido: Mapped[bool] = mapped_column(default=False)
    data_criacao: Mapped[datetime] = mapped_column(init=False, server_default=func.now())
    data_atualizacao: Mapped[datetime] = mapped_column(init=False, server_default=func.now())
    
    # Detalhes adicionais para diferentes tipos
    minutos_atraso: Mapped[Optional[int]] = mapped_column(default=None)  # Para atrasos
    horario_anterior: Mapped[Optional[str]] = mapped_column(default=None)  # Para mudanças
    horario_novo: Mapped[Optional[str]] = mapped_column(default=None)
    
    id_linha: Mapped[Optional[int]] = mapped_column(ForeignKey('linhas.id_linha'), default=None)
    linha: Mapped[Optional["Linha"]] = relationship(init=False)

@table_registry.mapped_as_dataclass
class AlertaProximidade:
    __tablename__ = 'alertas_proximidade'
    
    id: Mapped[int] = mapped_column(init=False, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'))
    linha_id: Mapped[int] = mapped_column(ForeignKey('linhas.id_linha'))
    
    latitude_usuario: Mapped[float] = mapped_column(Float)
    longitude_usuario: Mapped[float] = mapped_column(Float)
    
    latitude_veiculo: Mapped[Optional[float]] = mapped_column(Float, default=None)
    longitude_veiculo: Mapped[Optional[float]] = mapped_column(Float, default=None)
    
    distancia_metros: Mapped[Optional[int]] = mapped_column(default=None)
    eta_minutos: Mapped[Optional[int]] = mapped_column(default=None)
    
    ativo: Mapped[bool] = mapped_column(default=True)
    data_criacao: Mapped[datetime] = mapped_column(init=False, server_default=func.now())
    data_ultima_atualizacao: Mapped[datetime] = mapped_column(init=False, server_default=func.now())
    
    user: Mapped["User"] = relationship(init=False)
    linha: Mapped["Linha"] = relationship(init=False)