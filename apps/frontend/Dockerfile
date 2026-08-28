FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/worker/package.json ./apps/worker/
COPY apps/frontend/package.json ./apps/frontend/

RUN npm install

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build --workspace=apps/frontend

EXPOSE 3000

CMD ["npm", "run", "start", "--workspace=apps/frontend"]
