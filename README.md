# 🕐 Employee Work Hours Tracker

A modern full-stack time tracking application built with **Next.js 16**, **Prisma**, and **PostgreSQL**. Manage employee work hours, track vacation and sick days, handle leave requests, and generate comprehensive reports—all with a clean, responsive UI.

## ✨ Features

- **📅 Time Tracking**: Interactive calendar for logging daily work hours with morning/afternoon shift support
- **🏖️ Leave Management**: Complete leave request system (vacation, sick days, permission, etc.)
- **👥 Role-Based Access**: Separate employee and admin interfaces with granular permissions
- **📊 Reports & Analytics**: Generate Excel reports, view statistics, and analyze work patterns
- **🗓️ Italian Holidays**: Automatic integration with Italian public holidays
- **⚙️ Working Schedules**: Per-user customizable work schedules with flexible time configuration
- **📧 Email System**: Automated email notifications for welcome messages, password resets, and leave approvals
- **🔄 Google Calendar Sync**: Automatic synchronization of approved leave requests
- **💾 Automated Backups**: Scheduled database backups with email notifications
- **📱 Progressive Web App**: Installable app with offline support
- **🔐 Secure Authentication**: NextAuth with JWT sessions and automatic inactivity timeout

## 🚀 Getting Started

### Prerequisites

- **Docker** and **Docker Compose**
- **Node.js 20+** (if running locally without Docker)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd employee-app
   ```

2. **Environment Setup**
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   
   Configure the required environment variables (see [Environment Variables](#-environment-variables) section below).
   
   *Note: The default settings in `.env.example` are configured for the Docker setup.*

### Running with Docker (Recommended)

This method sets up the database and application automatically.

```bash
# Start the application and database
npm run docker:up

# To rebuild the images (if you made changes)
npm run docker:build

# To stop the application
npm run docker:down
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Running Locally (Development)

If you prefer to run the Next.js app on your host machine but keep the database in Docker:

1. **Start the Database**
   You can use the docker-compose service just for the DB, or run a local Postgres instance.
   ```bash
   # Start only the db service
   docker compose up -d db
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Database Setup**
   ```bash
   # Run migrations
   npm run prisma:migrate
   
   # Seed the database with initial users
   npm run prisma:seed
   ```

4. **Start the Development Server**
   ```bash
   npm run dev
   ```

## 🔑 Default Credentials

The database seeding process creates the following users:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@example.com` | `Admin123!` |
| **Employee** | `employee@example.com` | `Employee123!` |

## 🌍 Environment Variables

The application requires several environment variables to function. Create a `.env` file based on `.env.example` and configure the following:

### Required Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/employeedb"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"  # Generate with: openssl rand -base64 32

# Node Environment
NODE_ENV="development"  # or "production"
```

### Optional Variables

```env
# Email Configuration (for password reset and notifications)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
EMAIL_FROM="noreply@yourcompany.com"

# Google Calendar Integration (for leave sync)
GOOGLE_CLIENT_EMAIL="your-service-account@project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID="your-calendar-id@group.calendar.google.com"

# Database Backup (cron schedule)
BACKUP_CRON_SCHEDULE="0 2 * * *"  # Daily at 2 AM
```

See [docs/CONFIGURATION.md](docs/CONFIGURATION.md) for detailed setup instructions.

## 🛠 Project Structure

- **`/app`**: Next.js App Router pages and API routes
- **`/components`**: Reusable React components
- **`/lib`**: Utility functions, authentication, and database client
- **`/prisma`**: Database schema and migrations
- **`/public`**: Static assets
- **`/types`**: TypeScript type definitions

## 📝 Key Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start local development server |
| `npm run build` | Build for production |
| `npm run docker:up` | Start full stack in Docker |
| `npm run docker:build` | Rebuild and start full stack in Docker |
| `npm run docker:down` | Stop Docker containers |
| `npm run prisma:studio` | Open Prisma Studio GUI to view data |
| `npm run prisma:migrate` | Create and run database migrations |
| `npm run prisma:seed` | Seed database with test data |
| `npm run lint` | Run code linting |

## 📚 Documentation

See the `docs/` folder for comprehensive documentation:

- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment with Docker
- **[Configuration](docs/CONFIGURATION.md)** - Environment setup, email, backups, Google Calendar
- **[Contributing Guidelines](docs/CONTRIBUTING.md)** - How to contribute to the project
- **[PWA Setup](docs/PWA.md)** - Progressive Web App features and configuration
- **[Performance Optimizations](docs/PERFORMANCE_OPTIMIZATIONS.md)** - Caching and optimization strategies
- **[API Reference](docs/API_REFERENCE.md)** - Complete API endpoints documentation
- **[Leave Requests](docs/LEAVE_REQUESTS.md)** - Leave request workflow and approvals
- **[Working Schedules](docs/WORKING_SCHEDULES.md)** - User schedule configuration
- **[Backup System](docs/BACKUP_SYSTEM.md)** - Automated backup and restore procedures
