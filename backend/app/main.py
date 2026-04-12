from datetime import datetime, time as dt_time
from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database import get_db, init_db
from app.models import Favorite, Feedback, Horario, Linha, User, Viagem
from app.schemas import (
    FavoriteCreate,
    FavoriteResponse,
    FeedbackCreate,
    FeedbackResponse,
    HorarioCreate,
    HorarioResponse,
    LinhaCreate,
    LinhaResponse,
    UserCreate,
    UserResponse,
    ViagemCreate,
    ViagemResponse,
    CarteiraAbaResponse,
    LinhaTarifaResponse,
    ViagemHistoricoResponse,
)

app = FastAPI(title="Vambora Penedo")

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
        info_pagamento=linha.info_pagamento,
    )
    db.add(db_linha)
    db.commit()
    db.refresh(db_linha)
    return db_linha

@app.get("/linhas", response_model=List[LinhaResponse])
def list_linhas(db: Session = Depends(get_db)):
    return db.query(Linha).all()

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
                info_pagamento=linha.info_pagamento,
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
                    info_pagamento=viagem.linha.info_pagamento,
                ),
            )
            for viagem in historico
        ],
    )

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
