#!/bin/sh
echo "Applying Prisma migrations..."
npx prisma migrate deploy

echo "Starting Next.js application..."
exec next start
