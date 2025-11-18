#!/bin/sh
set -e

cd /app || exit 1

echo "Applying Prisma migrations..."
npx prisma migrate deploy

echo "Starting Next.js application..."
exec npx next start