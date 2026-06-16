from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.database import init_db
from app.routers import auth as auth_router

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


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)