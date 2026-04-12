# Vambora Penedo

Aplicação para centralizar informações de transporte público intermodal em Penedo - AL.

## Estrutura

```text
backend/   # API FastAPI
frontend/  # Aplicação Next.js
```

## Como rodar

Backend:

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

O banco local usa SQLite por padrao em `backend/vambora.db` quando `DATABASE_URL` nao estiver definido.

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Equipe

* **João Paulo Marinho** - Dev Front-end / Líder de UI/UX
* **Mirelly Barbosa Fontes** - Dev Back-end / Arquiteta de API
* **Valéria Silva Santos** - Dev Back-end / Arquiteta de DB
* **Laysa Edwyges Santos** - Engenheira de Dados / Especialista em rotas
* **João Pedro Calumby** - DevOps / Analista de QA
