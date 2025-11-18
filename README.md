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

## Installation

### Prerequisites

- Docker and Docker Compose
- Git

### Setup Steps

1. Clone the repository
```bash
git clone https://github.com/SilberGecko6917/Zeiterfassung.git
cd Zeiterfassung
```
2. Create a `.env.production` file using the template in `.env.example`
```run
cp .env.example .env.production
nano .env.production
```
3. Build and start the application
```run
docker compose up -d
```

### Initial Configuration
1. Navigate to `https://your-domain.com/install` in your browser
2. Follow the setup wizard to create an admin account
3. **System Settings** can be configured in the admin dashboard under Settings
   - **Landing Page**: Enable/disable the landing page (redirects to login when disabled)
   - **Auto Redirect**: Enable/disable automatic redirect from login to dashboard

## Updating
```run
sudo ./update.sh
```

### Development
```run
npm i --legacy-peer-deps
npm run dev
```

### Technical Stack
    - Frontend: Next.js with TypeScript
    - Database: SQLite via Prisma
    - Containerization: Docker & Docker Compose
    - Styling: Tailwind CSS
