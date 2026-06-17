from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.database import init_db
from app.routers import auth as auth_router
from app.routers import carteira as carteira_router
from app.routers import categorias as categorias_router
from app.routers import favoritos as favoritos_router
from app.routers import feedback as feedback_router
from app.routers import lembretes as lembretes_router
from app.routers import linhas as linhas_router
from app.routers import pagamento as pagamento_router
from app.routers import perfil as perfil_router
from app.routers import pontos as pontos_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="Vambora Penedo API",
    description="API do MVP do app de transporte público de Penedo–AL.",
    version="0.1.0",
    lifespan=lifespan,
    debug=settings.debug,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["health"])
def root() -> dict[str, str]:
    return {
        "service": "Vambora Penedo API",
        "version": app.version,
        "status": "ok",
    }


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(auth_router.router)
app.include_router(linhas_router.router)
app.include_router(pontos_router.router)
app.include_router(favoritos_router.router)
app.include_router(lembretes_router.router)
app.include_router(feedback_router.router)
app.include_router(carteira_router.router)
app.include_router(pagamento_router.router)
app.include_router(categorias_router.router)
app.include_router(perfil_router.router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)