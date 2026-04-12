from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.database import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    print("Banco de dados inicializado com sucesso!")
    yield

app = FastAPI(title="Vambora Penedo", lifespan=lifespan)

@app.get("/")
def read_root():
    return {"message": "API Vambora Penedo funcionando"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)