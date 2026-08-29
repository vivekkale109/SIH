FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/worker/package.json ./apps/worker/
COPY apps/frontend/package.json ./apps/frontend/

RUN npm install

COPY . .

RUN npx prisma generate --schema=apps/backend/prisma/schema.prisma
RUN npm run build --workspace=apps/backend

COPY apps/backend/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 4000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
