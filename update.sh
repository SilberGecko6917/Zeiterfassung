#!/bin/bash

RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
BLUE="\033[0;34m"
MAGENTA="\033[0;35m"
CYAN="\033[0;36m"
RESET="\033[0m"

echo -e "${CYAN}==============================="
echo -e "   Zeiterfassung Updater"
echo -e "===============================${RESET}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}Fehler:${RESET} Bitte als root oder mit sudo ausführen."
  exit 1
fi

cd "$(dirname "$0")"

BRANCH="${1:-}"

if [ -n "$BRANCH" ]; then
  echo -e "${MAGENTA}Nutze Branch:${RESET} $BRANCH"
  git fetch origin "$BRANCH"
  git checkout "$BRANCH"
else
  git fetch origin main
  git checkout main
fi

echo -e "${BLUE}Erstelle Backup...${RESET}"
BACKUP_DATE=$(date +"%Y%m%d_%H%M%S")
mkdir -p backups
tar -czf "backups/zeiterfassung_backup_${BACKUP_DATE}.tar.gz" .env.production prisma/migrations prisma/*.db
echo -e "${GREEN}Backup erstellt:${RESET} backups/zeiterfassung_backup_${BACKUP_DATE}.tar.gz"

echo -e "${BLUE}Pulling latest changes...${RESET}"
git pull

echo -e "${BLUE}Rebuild der Container...${RESET}"
docker compose down
docker compose build --no-cache
docker compose up -d

echo -e "${BLUE}Führe Datenbankmigrationen aus...${RESET}"
docker compose exec app npx prisma migrate deploy

echo -e "${BLUE}Bereinige Cache...${RESET}"
docker compose exec app npm run clear-cache

echo ""
echo -e "${GREEN}Update abgeschlossen!${RESET}"
echo -e "${YELLOW}Hinweis:${RESET} Du wirst eventuell aus der Anwendung ausgeloggt. Einfach wieder einloggen, ist keine Tragödie."
echo ""
echo -e "${CYAN}Backup gespeichert unter:${RESET} backups/zeiterfassung_backup_${BACKUP_DATE}.tar.gz"