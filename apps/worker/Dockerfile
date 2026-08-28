FROM node:20-alpine

# Install tesseract-ocr packages if native fallback is used
RUN apk add --no-co-cache tesseract-ocr tesseract-ocr-data-eng

WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/worker/package.json ./apps/worker/
COPY apps/frontend/package.json ./apps/frontend/

RUN npm install

COPY . .

RUN npx prisma generate --schema=apps/backend/prisma/schema.prisma
RUN npm run build --workspace=apps/worker

CMD ["node", "apps/worker/dist/index.js"]
