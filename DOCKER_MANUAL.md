# Manual Docker - Vambora Penedo 🐳

Bem-vindo(a) ao guia simplificado de Docker! Este guia foi feito especialmente para os membros da equipe (incluindo design e geoprocessamento) que querem rodar o projeto inteiro de forma rápida, sem perder horas configurando dependências no computador.

## Por que usar o Docker? 🤔
O Docker cria "caixas isoladas" (containers) para o banco de dados, o backend e o frontend. Isso significa que o famoso *"Na minha máquina funciona, na sua não"* acaba aqui. Se rodou no Docker, vai rodar no computador de todo mundo da mesma forma!

## Requisitos Iniciais
1. Baixe e instale o **Docker Desktop** (https://www.docker.com/products/docker-desktop/).
2. Abra o Docker Desktop e deixe-o rodando minimizado.
3. Tenha certeza de que criou uma cópia do arquivo `.env.example` renomeada para `.env` na pasta raiz do projeto. Cole lá a chave `SECRET_KEY` confidencial do time.

## Como rodar tudo com apenas UM COMANDO 🔥

1. Abra seu terminal (Pode ser o terminal integrado do VSCode dentro do VAMBORA-PENEDO).
2. Digite o seguinte comando:
   ```bash
   docker-compose up --build
   ```
3. Aguarde o Docker baixar o "Node" e o "Python" pra dentro dele e configurar a rede.
4. **Pronto!** 
   - O Frontend (React) estará rodando em: `http://localhost:3000`
   - O Backend (API/Docs) estará rodando em: `http://localhost:8000/docs`

> [!TIP]
> **Como parar o Projeto:** Basta pressionar `CTRL + C` no terminal onde ele está rodando. Se quiser desligar limpando tudo em background, digite `docker-compose down`.

### Como rodar as coisas separadamente (Avançado)
Caso precise trabalhar apenas no Frontend local e deixar só a API no Docker:
- `docker-compose up backend --build` (Sobe apenas o servidor Python).

Caso queira saber mais ou tirar dúvidas, peça socorro no chat da equipe! 🚀
