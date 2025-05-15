#!/bin/bash

echo "Starting Zeiterfassung update process..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo "Please run as root or with sudo"
  exit 1
fi

cd "$(dirname "$0")"

echo "Creating backup..."
BACKUP_DATE=$(date +"%Y%m%d_%H%M%S")
mkdir -p backups
tar -czf "backups/zeiterfassung_backup_${BACKUP_DATE}.tar.gz" .env.production prisma/migrations prisma/*.db

echo "Pulling latest changes from Git repository..."
git pull

echo "Rebuilding containers..."
docker compose down
docker compose build --no-cache
docker compose up -d

echo "Running database migrations..."
docker compose exec app npx prisma migrate deploy

echo "Clearing cache..."
docker compose exec app npm run clear-cache

echo "Update completed successfully!"
echo "If you encounter any issues, restore the backup from: backups/zeiterfassung_backup_${BACKUP_DATE}.tar.gz"