#!/bin/sh
set -e

cd /app || exit 1

if [ ! -f "/app/data/data.db" ]; then
    echo "Creating database file..."
    mkdir -p /app/data
    touch /app/data/data.db
fi

echo "Applying Prisma migrations..."
npx prisma migrate deploy

echo "Starting Next.js application..."
exec npx next start