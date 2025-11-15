## Work Hours Tracker

Full stack time tracking portal built with Next.js App Router, Prisma, NextAuth, and PostgreSQL. Employees can log their daily work hours on a calendar while administrators review team-wide activity from a dedicated dashboard.

### Features

- Email and password authentication backed by NextAuth and Prisma.
- **Automatic session timeout** after 30 minutes of inactivity with activity tracking.
- Employee dashboard with interactive calendar, quick entry form, and recent activity list.
- Admin dashboard summarising total hours, last activity date, and join date for every user.
- REST API routes for logging hours and managing users, secured by session and role checks.
- Prisma schema with seed script that provisions sample admin and employee accounts.
- Docker deployment with PostgreSQL container and automated migrations.
- PM2 process manager for production deployment with automatic restart and monitoring.

### Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 14+ (running as a service) OR Docker for containerized deployment

### Quick Start

#### Option 1: Docker Deployment (Recommended)

```bash
# 1. Configure environment
cp .env.docker.example .env.docker
# Edit .env.docker with your settings

# 2. Deploy
npm run docker:deploy

# 3. Access the app
open http://localhost:3000
```

#### Option 2: Local Development

1. **Install dependencies and generate the Prisma client:**

```bash
npm install
npx prisma generate
```

2. **Create the database schema and seed sample data:**

```bash
npx prisma migrate dev --name init
npm run prisma:seed
```

3. **Launch the Next.js development server:**

```bash
npm run dev
```

Sample credentials provided by the seed script:

- Admin: `admin@example.com` / `Admin123!`
- Employee: `employee@example.com` / `Employee123!`

### Production Deployment

1. **Build the application:**

```bash
npm run build
```

2. **Apply database migrations:**

```bash
npm run prisma:deploy
```

3. **Start with PM2:**

```bash
npm run pm2:start
```

4. **Manage the application:**

```bash
npm run pm2:logs      # View application logs
npm run pm2:monit     # Monitor resources in real-time
npm run pm2:restart   # Restart the application
npm run pm2:stop      # Stop the application
npm run pm2:delete    # Remove from PM2
```

PM2 configuration is in `ecosystem.config.js`. The app runs on port 3000 by default with automatic restart on crashes and memory limit of 1GB.

### Useful Scripts

**Development:**
- `npm run dev` - start development server.
- `npm run lint` - lint the project with ESLint.

**Database:**
- `npm run prisma:generate` - regenerate the Prisma client.
- `npm run prisma:migrate` - run development migrations.
- `npm run prisma:deploy` - apply migrations in production environments.
- `npm run prisma:seed` - seed the database with sample users and entries.

**Database Backup:**
- `npm run backup:db` - create immediate database backup.
- `npm run restore:db <file>` - restore database from backup.
- `npm run backup:cleanup` - remove old backups (retention policy).

See [BACKUP_STRATEGY.md](./BACKUP_STRATEGY.md) for complete backup documentation.

### Security Features

**Session Management:**
- Automatic logout after 30 minutes of inactivity.
- Activity tracking monitors user interactions (clicks, scrolls, key presses).
- Session automatically renewed every 5 minutes if user is active.
- Server-side and client-side validation for session expiration.

See [docs/INACTIVITY_TIMEOUT.md](./docs/INACTIVITY_TIMEOUT.md) for detailed implementation and configuration.

**Production:**
- `npm run build` - create an optimised production build.
- `npm run pm2:start` - start application with PM2.
- `npm run pm2:stop` - stop the PM2 process.
- `npm run pm2:restart` - restart the application.
- `npm run pm2:logs` - view application logs.
- `npm run pm2:monit` - monitor resources in real-time.
- `npm run pm2:delete` - remove application from PM2.

### Project Structure

- `app/` - Next.js App Router routes, including employee and admin dashboards.
- `app/api/` - Route handlers for authentication, hours, and user management.
- `components/` - Client components for login and dashboard experiences.
- `prisma/` - Database schema and seed script.
- `scripts/` - Backup and maintenance scripts for database management.
- `backups/` - Database backups directory (gitignored).
- `ecosystem.config.js` - PM2 configuration for production deployment.
- `logs/` - PM2 application logs (gitignored).

## 📚 Documentation

Additional documentation is available in the [`docs/`](./docs/) directory:

- **[DOCKER.md](./docs/DOCKER.md)** - Complete Docker deployment guide
- **[DOCKER_SETUP.md](./docs/DOCKER_SETUP.md)** - Docker setup summary
- **[BACKUP_STRATEGY.md](./docs/BACKUP_STRATEGY.md)** - Database backup strategy
- **[EMAIL_SETUP.md](./docs/EMAIL_SETUP.md)** - Email configuration guide
- **[CHANGELOG.md](./docs/CHANGELOG.md)** - Version history and changes
- **[INACTIVITY_TIMEOUT.md](./docs/INACTIVITY_TIMEOUT.md)** - Session timeout implementation
- **[CLAUDE.md](./docs/CLAUDE.md)** - AI assistant integration notes
- **[GITHUB_SECRETS_EMAIL.md](./docs/GITHUB_SECRETS_EMAIL.md)** - GitHub secrets configuration

## 📋 Available Scripts

### Development
- `npm run dev` - Start development server
- `npm run build` - Create production build
- `npm run lint` - Run ESLint

### Database
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:deploy` - Deploy migrations in production
- `npm run prisma:seed` - Seed database with test data
- `npm run backup:db` - Create database backup
- `npm run restore:db` - Restore database from backup
- `npm run backup:cleanup` - Clean old backups

### Docker
- `npm run docker:build` - Build Docker images
- `npm run docker:up` - Start containers
- `npm run docker:down` - Stop containers
- `npm run docker:logs` - View container logs
- `npm run docker:restart` - Restart containers
- `npm run docker:deploy` - Full deployment (build + start)

### Production (PM2)
- `npm run pm2:start` - Start with PM2
- `npm run pm2:stop` - Stop PM2 process
- `npm run pm2:restart` - Restart application
- `npm run pm2:logs` - View PM2 logs
- `npm run pm2:monit` - Monitor resources
