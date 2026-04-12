from fastapi import FastAPI
from app.database import init_db

app = FastAPI(title="Vambora Penedo")

@app.on_event("startup")
def startup():
    init_db()
    print("✅ Banco de dados inicializado!")

@app.get("/")
def read_root():
    return {"message": "API Vambora Penedo funcionando"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)