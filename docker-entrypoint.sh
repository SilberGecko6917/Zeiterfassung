#!/bin/sh
cd /app || exit
echo "Applying Prisma migrations..."
npx prisma migrate deploy

echo "Starting Next.js application..."
exec npx next start
