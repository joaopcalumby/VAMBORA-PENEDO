# Manual Docker - Vambora Penedo 🐳

Bem-vindo(a) ao guia simplificado de Docker! Este guia foi feito especialmente para os membros da equipe (incluindo design e geoprocessamento) que querem rodar o projeto inteiro de forma rápida, sem perder horas configurando dependências no computador.

## Por que usar o Docker? 🤔

O Docker cria "caixas isoladas" (containers) para o banco de dados, o backend e o frontend. Isso significa que o famoso *"Na minha máquina funciona, na sua não"* acaba aqui. Se rodou no Docker, vai rodar no computador de todo mundo da mesma forma!

## Requisitos Iniciais

1. Baixe e instale o **Docker Desktop** (https://www.docker.com/products/docker-desktop/).
2. Abra o Docker Desktop e deixe-o rodando minimizado.
3. Tenha certeza de que criou uma cópia do arquivo `.env.example` renomeada para `.env` na pasta raiz do projeto e preencha as URLs públicas do deploy.

## Como rodar tudo com apenas UM COMANDO 🔥

1. Abra seu terminal (Pode ser o terminal integrado do VSCode dentro do VAMBORA-PENEDO).
2. Digite o seguinte comando:
   ```bash
   docker-compose up --build
   ```
3. Aguarde o Docker baixar o "Node" e o "Python" pra dentro dele e configurar a rede.
4. **Pronto!**
   - O Frontend (React) estará rodando em: `http://localhost:3001`
   - O Backend (API/Docs) estará rodando em: `http://localhost:8000/docs`

> [!TIP]
> **Como parar o Projeto:** Basta pressionar `CTRL + C` no terminal onde ele está rodando. Se quiser desligar limpando tudo em background, digite `docker-compose down`.

### Como rodar as coisas separadamente (Avançado)

Caso precise trabalhar apenas no Frontend local e deixar só a API no Docker:

- `docker-compose up backend --build` (Sobe apenas o servidor Python).

Caso queira saber mais ou tirar dúvidas, peça socorro no chat da equipe! 🚀

## Easy Panel

Para publicar via Easy Panel com `docker-compose`, use este fluxo:

1. Crie dois serviços a partir do mesmo compose: `backend` e `frontend`.
2. No backend, defina `BACKEND_CORS_ORIGINS` com a URL pública do frontend.
3. No frontend, defina `NEXT_PUBLIC_API_URL` com a URL pública do backend.
4. Defina `NEXTAUTH_URL` com a URL pública do frontend e `NEXTAUTH_SECRET` com uma string forte.
5. Defina `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` se a tela de mapa for usada.
6. Mantenha o volume `backend_data` para persistir o SQLite se você não for migrar para PostgreSQL.

Se estiver usando domínios separados, o frontend deve acessar a API pela URL pública do backend, não pelo nome interno do container.
