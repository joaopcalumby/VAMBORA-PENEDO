import os

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import time as dt_time

from app.database import get_db, init_db
from app.models import Alerta, AlertaProximidade, Favorite, Feedback, Horario, Linha, User, Viagem
from app.schemas import (
    AlertaCreate,
    AlertaProximidadeCreate,
    AlertaProximidadeResponse,
    AlertaResponse,
    CarteiraAbaResponse,
    FavoriteCreate,
    FavoriteResponse,
    FeedbackCreate,
    FeedbackResponse,
    HorarioCreate,
    HorarioResponse,
    LinhaCreate,
    LinhaResponse,
    LinhaTarifaResponse,
    UserCreate,
    UserResponse,
    ViagemCreate,
    ViagemResponse,
    ViagemHistoricoResponse,
)

app = FastAPI(title="Vambora Penedo")


def get_cors_origins() -> list[str]:
    configured_origins = os.getenv("BACKEND_CORS_ORIGINS", "")

    if configured_origins.strip():
        return [origin.strip() for origin in configured_origins.split(",") if origin.strip()]

    return [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    city: str = Field(min_length=1, max_length=120)
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: str
    password: str


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


@app.on_event("startup")
def startup():
    init_db()
    print("✅ Banco de dados inicializado!")


@app.get("/")
def read_root():
    return {"message": "API Vambora Penedo funcionando"}

@app.post("/users", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Usuario com este e-mail ja existe")

    db_user = User(email=user.email, password=user.password, username=user.username)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/users", response_model=List[UserResponse])
def list_users(db: Session = Depends(get_db)):
    return db.query(User).all()

@app.post("/linhas", response_model=LinhaResponse)
def create_linha(linha: LinhaCreate, db: Session = Depends(get_db)):
    db_linha = Linha(
        nome=linha.nome,
        tipo_transporte=linha.tipo_transporte,
        tarifa=linha.tarifa,
        numero=linha.numero,
        info_pagamento=_serialize_payment_info(linha.info_pagamento),
    )
    db.add(db_linha)
    db.commit()
    db.refresh(db_linha)
    return LinhaResponse(
        id_linha=db_linha.id_linha,
        nome=db_linha.nome,
        tipo_transporte=db_linha.tipo_transporte,
        tarifa=db_linha.tarifa,
        numero=db_linha.numero,
        info_pagamento=_parse_payment_info(db_linha.info_pagamento),
    )

@app.get("/linhas", response_model=List[LinhaResponse])
def list_linhas(db: Session = Depends(get_db)):
    return [
        LinhaResponse(
            id_linha=linha.id_linha,
            nome=linha.nome,
            tipo_transporte=linha.tipo_transporte,
            tarifa=linha.tarifa,
            numero=linha.numero,
            info_pagamento=_parse_payment_info(linha.info_pagamento),
        )
        for linha in db.query(Linha).all()
    ]

@app.post("/horarios", response_model=HorarioResponse)
def create_horario(horario: HorarioCreate, db: Session = Depends(get_db)):
    linha = db.query(Linha).filter(Linha.id_linha == horario.id_linha).first()
    if not linha:
        raise HTTPException(status_code=404, detail="Linha nao encontrada")

    db_horario = Horario(
        tipo_dia=horario.tipo_dia,
        horario_partida=dt_time.fromisoformat(horario.horario_partida),
        id_linha=horario.id_linha,
    )
    db.add(db_horario)
    db.commit()
    db.refresh(db_horario)
    return db_horario

@app.get("/horarios", response_model=List[HorarioResponse])
def list_horarios(db: Session = Depends(get_db)):
    return db.query(Horario).all()

@app.post("/favorites", response_model=FavoriteResponse)
def create_favorite(favorite: FavoriteCreate, db: Session = Depends(get_db)):
    user = db.get(User, favorite.user_id)
    linha = db.get(Linha, favorite.linha_id)
    if not user or not linha:
        raise HTTPException(status_code=404, detail="Usuario ou linha nao encontrada")

    db_favorite = Favorite(user_id=favorite.user_id, linha_id=favorite.linha_id)
    db.add(db_favorite)
    db.commit()
    db.refresh(db_favorite)
    return db_favorite

@app.get("/favorites", response_model=List[FavoriteResponse])
def list_favorites(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Favorite)
    if user_id is not None:
        query = query.filter(Favorite.user_id == user_id)
    return query.all()

@app.post("/feedbacks", response_model=FeedbackResponse)
def create_feedback(feedback: FeedbackCreate, db: Session = Depends(get_db)):
    user = db.get(User, feedback.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario nao encontrado")

    db_feedback = Feedback(
        tipo=feedback.tipo,
        descricao=feedback.descricao,
        user_id=feedback.user_id,
    )
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    return db_feedback

@app.get("/feedbacks", response_model=List[FeedbackResponse])
def list_feedbacks(db: Session = Depends(get_db)):
    return db.query(Feedback).all()

@app.post("/viagens", response_model=ViagemResponse)
def create_viagem(viagem: ViagemCreate, db: Session = Depends(get_db)):
    user = db.get(User, viagem.user_id)
    linha = db.get(Linha, viagem.linha_id)
    if not user or not linha:
        raise HTTPException(status_code=404, detail="Usuario ou linha nao encontrada")

    db_viagem = Viagem(
        valor_pago=viagem.valor_pago,
        user_id=viagem.user_id,
        linha_id=viagem.linha_id,
    )
    db.add(db_viagem)
    db.commit()
    db.refresh(db_viagem)
    return db_viagem

@app.get("/viagens", response_model=List[ViagemResponse])
def list_viagens(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Viagem)
    if user_id is not None:
        query = query.filter(Viagem.user_id == user_id)
    return query.all()

@app.get("/users/{user_id}/carteira", response_model=CarteiraAbaResponse)
def get_carteira(user_id: int, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario nao encontrado")

    tarifas = db.query(Linha).all()
    historico = (
        db.query(Viagem)
        .options(joinedload(Viagem.linha))
        .filter(Viagem.user_id == user_id)
        .order_by(Viagem.data_viagem.desc())
        .limit(10)
        .all()
    )

    return CarteiraAbaResponse(
        tarifas_vigentes=[
            LinhaTarifaResponse(
                id_linha=linha.id_linha,
                nome=linha.nome,
                tipo_transporte=linha.tipo_transporte,
                tarifa=linha.tarifa,
                numero=linha.numero,
                info_pagamento=_parse_payment_info(linha.info_pagamento),
            )
            for linha in tarifas
        ],
        historico_recente=[
            ViagemHistoricoResponse(
                id=viagem.id,
                valor_pago=viagem.valor_pago,
                data_viagem=viagem.data_viagem,
                linha=LinhaTarifaResponse(
                    id_linha=viagem.linha.id_linha,
                    nome=viagem.linha.nome,
                    tipo_transporte=viagem.linha.tipo_transporte,
                    tarifa=viagem.linha.tarifa,
                    numero=viagem.linha.numero,
                    info_pagamento=_parse_payment_info(viagem.linha.info_pagamento),
                ),
            )
            for viagem in historico
        ],
    )

# ========== ALERTAS GERAIS ==========

# Listar alertas ativos com filtros
@app.get("/alertas", response_model=List[AlertaResponse])
def list_alertas(
    id_linha: Optional[int] = None,
    tipo: Optional[str] = None,
    severidade: Optional[str] = None,
    apenas_nao_lidos: bool = False,
    db: Session = Depends(get_db)
):
    """
    Lista alertas com múltiplos filtros.
    Tipos: atraso, mudanca_horario, mudanca_rota, tarifa, proximidade
    """
    query = db.query(Alerta).filter(Alerta.ativa == True)
    
    if id_linha:
        query = query.filter(Alerta.id_linha == id_linha)
    if tipo:
        query = query.filter(Alerta.tipo == tipo)
    if severidade:
        query = query.filter(Alerta.severidade == severidade)
    if apenas_nao_lidos:
        query = query.filter(Alerta.lido == False)
    
    return query.order_by(Alerta.data_criacao.desc()).all()

# Criar novo alerta (Uso administrativo/operacional)
@app.post("/alertas", response_model=AlertaResponse)
def create_alerta(alerta: AlertaCreate, db: Session = Depends(get_db)):
    """Cria um novo alerta no sistema"""
    db_alerta = Alerta(**alerta.dict())
    db.add(db_alerta)
    db.commit()
    db.refresh(db_alerta)
    return db_alerta

# Obter alerta por ID
@app.get("/alertas/{alerta_id}", response_model=AlertaResponse)
def get_alerta(alerta_id: int, db: Session = Depends(get_db)):
    """Obtém detalhes de um alerta específico"""
    alerta = db.get(Alerta, alerta_id)
    if not alerta:
        raise HTTPException(status_code=404, detail="Alerta não encontrado")
    return alerta

# Marcar alerta como lido
@app.patch("/alertas/{alerta_id}/lido")
def mark_alerta_as_read(alerta_id: int, db: Session = Depends(get_db)):
    """Marca um alerta como lido"""
    alerta = db.get(Alerta, alerta_id)
    if not alerta:
        raise HTTPException(status_code=404, detail="Alerta não encontrado")
    
    alerta.lido = True
    db.commit()
    return {"status": "sucesso", "message": "Alerta marcado como lido"}

# Desativar alerta
@app.patch("/alertas/{alerta_id}/desativar")
def deactivate_alerta(alerta_id: int, db: Session = Depends(get_db)):
    """Desativa um alerta"""
    alerta = db.get(Alerta, alerta_id)
    if not alerta:
        raise HTTPException(status_code=404, detail="Alerta não encontrado")
    
    alerta.ativa = False
    db.commit()
    return {"status": "sucesso", "message": "Alerta desativado"}

# ========== ALERTAS POR TIPO ==========

# Criar alerta de atraso
@app.post("/alertas/atrasos", response_model=AlertaResponse)
def create_alerta_atraso(
    id_linha: int,
    minutos_atraso: int,
    db: Session = Depends(get_db)
):
    """Cria um alerta de atraso em uma linha"""
    linha = db.get(Linha, id_linha)
    if not linha:
        raise HTTPException(status_code=404, detail="Linha não encontrada")
    
    alerta = Alerta(
        titulo=f"Atraso na linha {linha.nome}",
        descricao=f"A linha está {minutos_atraso} minutos atrasada",
        tipo="atraso",
        severidade="alta" if minutos_atraso > 15 else "media",
        minutos_atraso=minutos_atraso,
        id_linha=id_linha
    )
    db.add(alerta)
    db.commit()
    db.refresh(alerta)
    return alerta

# Criar alerta de mudança de horário
@app.post("/alertas/mudanca-horario", response_model=AlertaResponse)
def create_alerta_mudanca_horario(
    id_linha: int,
    horario_anterior: str,
    horario_novo: str,
    db: Session = Depends(get_db)
):
    """Cria um alerta de mudança de horário"""
    linha = db.get(Linha, id_linha)
    if not linha:
        raise HTTPException(status_code=404, detail="Linha não encontrada")
    
    alerta = Alerta(
        titulo=f"Mudança de horário - {linha.nome}",
        descricao=f"Horário alterado de {horario_anterior} para {horario_novo}",
        tipo="mudanca_horario",
        severidade="media",
        horario_anterior=horario_anterior,
        horario_novo=horario_novo,
        id_linha=id_linha
    )
    db.add(alerta)
    db.commit()
    db.refresh(alerta)
    return alerta

# Criar alerta de mudança de rota
@app.post("/alertas/mudanca-rota", response_model=AlertaResponse)
def create_alerta_mudanca_rota(
    id_linha: int,
    descricao_mudanca: str,
    db: Session = Depends(get_db)
):
    """Cria um alerta de mudança de rota"""
    linha = db.get(Linha, id_linha)
    if not linha:
        raise HTTPException(status_code=404, detail="Linha não encontrada")
    
    alerta = Alerta(
        titulo=f"Alteração de rota - {linha.nome}",
        descricao=descricao_mudanca,
        tipo="mudanca_rota",
        severidade="alta",
        id_linha=id_linha
    )
    db.add(alerta)
    db.commit()
    db.refresh(alerta)
    return alerta

# ========== ALERTAS DE PROXIMIDADE ==========

# Criar alerta de proximidade
@app.post("/alertas/proximidade", response_model=AlertaProximidadeResponse)
def create_alerta_proximidade(
    alerta: AlertaProximidadeCreate,
    user_id: int,
    db: Session = Depends(get_db)
):
    """
    Cria um alerta de proximidade para um usuário.
    Monitora quando um veículo se aprocima do ponto de parada.
    """
    user = db.get(User, user_id)
    linha = db.get(Linha, alerta.linha_id)
    
    if not user or not linha:
        raise HTTPException(status_code=404, detail="Usuário ou linha não encontrada")
    
    db_alerta = AlertaProximidade(
        user_id=user_id,
        linha_id=alerta.linha_id,
        latitude_usuario=alerta.latitude_usuario,
        longitude_usuario=alerta.longitude_usuario,
        latitude_veiculo=alerta.latitude_veiculo,
        longitude_veiculo=alerta.longitude_veiculo,
        eta_minutos=alerta.eta_minutos
    )
    db.add(db_alerta)
    db.commit()
    db.refresh(db_alerta)
    return db_alerta

# Atualizar localização de proximidade
@app.patch("/alertas/proximidade/{alerta_id}/localizacao")
def update_proximity_location(
    alerta_id: int,
    latitude_veiculo: float,
    longitude_veiculo: float,
    eta_minutos: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Atualiza a localização do veículo para um alerta de proximidade"""
    alerta = db.get(AlertaProximidade, alerta_id)
    if not alerta:
        raise HTTPException(status_code=404, detail="Alerta de proximidade não encontrado")
    
    alerta.latitude_veiculo = latitude_veiculo
    alerta.longitude_veiculo = longitude_veiculo
    if eta_minutos:
        alerta.eta_minutos = eta_minutos
    
    # Calcular distância simplificada (Haversine omitido por simplicidade)
    # Em produção, usar biblioteca como 'geopy'
    alerta.data_ultima_atualizacao = datetime.now()
    db.commit()
    
    return {"status": "sucesso", "message": "Localização atualizada", "eta_minutos": eta_minutos}

# Listar alertas de proximidade ativos
@app.get("/alertas/proximidade/user/{user_id}", response_model=List[AlertaProximidadeResponse])
def list_user_proximity_alerts(user_id: int, db: Session = Depends(get_db)):
    """Lista todos os alertas de proximidade ativos de um usuário"""
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    return (
        db.query(AlertaProximidade)
        .filter(AlertaProximidade.user_id == user_id, AlertaProximidade.ativo == True)
        .order_by(AlertaProximidade.data_ultima_atualizacao.desc())
        .all()
    )

# Desativar alerta de proximidade
@app.patch("/alertas/proximidade/{alerta_id}/desativar")
def deactivate_proximity_alert(alerta_id: int, db: Session = Depends(get_db)):
    """Desativa um alerta de proximidade"""
    alerta = db.get(AlertaProximidade, alerta_id)
    if not alerta:
        raise HTTPException(status_code=404, detail="Alerta de proximidade não encontrado")
    
    alerta.ativo = False
    db.commit()
    return {"status": "sucesso", "message": "Alerta de proximidade desativado"}

# Simulador de proximidade (para testes)
@app.get("/alertas/proximidade-simulado/{linha_id}")
def simular_proximidade_veiculo(
    user_id: int,
    linha_id: int,
    lat_usuario: float,
    lon_usuario: float,
    db: Session = Depends(get_db)
):
    """
    Simula um veículo se aproximando do usuário.
    Útil para testes e demonstração.
    """
    from math import sqrt
    
    linha = db.get(Linha, linha_id)
    if not linha:
        raise HTTPException(status_code=404, detail="Linha não encontrada")
    
    # Simular veículo em rota
    lat_veiculo = lat_usuario + 0.001  # ~111 metros de distância
    lon_veiculo = lon_usuario + 0.001
    
    # Calcular distância aprox (Haversine simplificado)
    distancia_aprox = sqrt(
        (lat_veiculo - lat_usuario)**2 + (lon_veiculo - lon_usuario)**2
    ) * 111000  # converter para metros
    
    return {
        "linha": linha.nome,
        "status": "veiculo_proximo",
        "distancia_metros": int(distancia_aprox),
        "eta_minutos": 2,
        "latitude_veiculo": lat_veiculo,
        "longitude_veiculo": lon_veiculo,
        "mensagem": "Seu transporte esta chegando!"
    }


@app.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()

    if len(payload.password) > 128:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A senha deve ter no maximo 128 caracteres.",
        )

    existing_user = db.scalar(select(User).where(User.email == email))
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="E-mail ja cadastrado.",
        )

    user = User(
        email=email,
        password=hash_password(payload.password),
        username=payload.name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "message": "Conta criada com sucesso.",
        "user": {
            "name": user.username,
            "email": user.email,
        },
    }


@app.post("/auth/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    user = db.scalar(select(User).where(User.email == email))
    if not user or not verify_password(payload.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos.",
        )

    return {
        "user": {
            "name": user.username,
            "email": user.email,
        },
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
