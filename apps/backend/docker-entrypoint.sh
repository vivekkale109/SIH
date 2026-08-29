#!/bin/sh
set -e

echo "Applying database schema migrations/push..."
npx prisma db push --schema=apps/backend/prisma/schema.prisma --accept-data-loss

echo "Seeding initial demo data (if not seeded)..."
npx ts-node apps/backend/prisma/seed.ts || echo "Seeding finished or skipped."

echo "Starting SDMS Backend API Server..."
exec node apps/backend/dist/main.js
