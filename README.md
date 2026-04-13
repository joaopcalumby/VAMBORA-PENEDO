# Vambora Penedo

Aplicação para centralizar informações de transporte público intermodal em Penedo - AL.

## Estrutura

```text
backend/   # API FastAPI
frontend/  # Aplicação Next.js
```

## Como Executar este MVP 🐳

Para rodar todo o ecossistema (banco de dados, api e website) de modo orquestrado e sem precisar instalar Python ou Node localmente, siga os passos abaixo:

1. **Clone este repositório:**

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

O banco local usa SQLite por padrao em `backend/vambora.db` quando `DATABASE_URL` nao estiver definido.

Frontend:
>>>>>>>>> Temporary merge branch 2

   - Faça uma cópia do arquivo `.env.example` chamando de `.env` na raiz do projeto (mesma pasta deste arquivo README.md).
   - Preencha os campos solicitados (como o `SECRET_KEY`).
3. **Suba o ambiente em Docker:**

   ```bash
   # Com o Docker Desktop já rodando em sua máquina:
   docker-compose up -d --build
   ```
4. **Acesse as aplicações:**

   - **Frontend (Website):** `http://localhost:3001`
   - **Backend (API Docs):** `http://localhost:8000/docs`

> **Quer saber mais detalhes do nosso Setup ou rodar as coisas separadamente?**
> 👉 **[Leia o Manual do Docker para a Equipe aqui!](./DOCKER_MANUAL.md)** 🐳

## Equipe

* **João Paulo Marinho** - Dev Front-end / Líder de UI/UX
* **Mirelly Barbosa Fontes** - Dev Back-end / Arquiteta de API
* **Valéria Silva Santos** - Dev Back-end / Arquiteta de DB
* **Laysa Edwyges Santos** - Engenheira de Dados / Especialista em rotas
* **João Pedro Calumby** - DevOps / Analista de QA
