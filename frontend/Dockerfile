# Estágio de dependências
FROM node:22-alpine as deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Estágio de construção
FROM node:22-alpine as builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build 

# Estágio de execução
FROM node:22-alpine as runner
WORKDIR /app
ENV NODE_ENV=production

# Arquivos necessários para next start
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["npm", "start"]
