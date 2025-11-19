# Zeiterfassung

A modern time tracking system built with Next.js.

> [!IMPORTANT]
> Please report **Bugs** and **Feature Requests** using the [Github Issue Forum](https://github.com/SilberGecko6917/Zeiterfassung/issues/new)

~ Developed by [SilberGecko](https://github.com/silbergecko6917)

## Features

- User-friendly time tracking interface
- Automatic and manual break management
- Comprehensive reporting and data export
- Administrator dashboard with detailed analytics
- Responsive design for desktop and mobile use

## Quick Start (Recommended)

### Prerequisites

- Docker and Docker Compose

### Setup Steps

1. Download the required files:
   - [`docker-compose.yml`](https://raw.githubusercontent.com/SilberGecko6917/Zeiterfassung/main/docker-compose.yml)
   - [`.env.example`](https://raw.githubusercontent.com/SilberGecko6917/Zeiterfassung/main/.env.example)

2. Create your environment file:
```bash
cp .env.example .env
```

3. Start the application:
```bash
docker compose up -d
```


> **Note:** The database is automatically created in the `./data` folder and persists between container updates.

### Initial Configuration
1. Navigate to `https://your-domain.com/install` in your browser
2. Follow the setup wizard to create an admin account
3. **System Settings** can be configured in the admin dashboard under Settings
   - **Landing Page**: Enable/disable the landing page (redirects to login when disabled)
   - **Auto Redirect**: Enable/disable automatic redirect from login to dashboard

## Updating

To update to the latest version:
```bash
docker compose down
docker compose pull
docker compose up -d
```

## Alternative: Full Repository Setup (for developers)

If you want to modify the code or contribute to the project:

### Prerequisites
- Docker and Docker Compose  
- Git

### Setup Steps
1. Clone the repository:
```bash
git clone https://github.com/SilberGecko6917/Zeiterfassung.git
cd Zeiterfassung
```

2. Create environment file:
```bash
cp .env.example .env
# Edit .env with your settings
```

3. Start with pre-built image:
```bash
docker compose up -d
```

### Updating (Repository Setup)
```bash
git pull
docker compose down
docker compose pull
docker compose up -d
```

## Upgrade from Old System

If you're upgrading from the old local build system:

### Quick Migration

1. **Stop and backup:**
```bash
docker compose down
cp prisma/data.db backup_data.db  # backup your database
```

2. **Update files:**
```bash
git pull  # or download new docker-compose.yml
mkdir -p data && cp prisma/data.db data/data.db  # move database
```

3. **Start new system:**
```bash
docker compose up -d
```

## Development

For local development with live reload:

### Prerequisites
- Node.js 20+
- npm

### Setup
```bash
# Install dependencies
npm install

# Copy environment file for development
cp .env.example .env

# Start development server (recomendet)
npm run dev

# OR use Docker for development with live reload
docker compose -f docker-compose.dev.yml up
```